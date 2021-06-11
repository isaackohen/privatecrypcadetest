const { SHOPPING_FEE } = require("../constants/shop");
const { integer, nodeCrypto } = require("random-js");
const common = require("../helpers/common");
const { dbModel } = require("../model/db");
const BalancesService = require("../services/balances");
const PoolService = require("../services/pool");

const powDivider = Math.pow(10, 6);

module.exports = class ShopService {
  // async getShopBoxes(active = true) {
  //   return dbModel.shopBoxes
  //     .find({ active })
  //     .sort({ price: 1 });
  // }

  async getShopBoxes(currency, active = true) {
    return dbModel.shopBoxes
      .find({ active, currency: currency })
      .sort({ price: 1 });
  }

  async getShopBox(boxId, active = true) {
    return dbModel.shopBoxes.findOne({ active, _id: boxId });
  }

  async buyShopBox(userId, shopBoxId, currency) {
    const response = {};

    const shopBox = await this.getShopBox(shopBoxId);

    const { price, amount, multiplier } = shopBox;

    if (multiplier.max) {
      response.multiplierWon = await this.applyMultiplier(userId, shopBox);
    }

    const priceWithoutFee = this.getPriceWithoutFee(price);
    await this.subtractFromBalance(userId, price, currency);
    await common.tokenInsertion({ userId }, amount);
    const obj = {
      userId: userId,
      betAmount: price,
      game_type: 1,
      currency: currency,
    };
    await common.ticketSystem(obj);
    await this.createNewShopTransaction(
      userId,
      shopBox,
      response.multiplierWon
    );
    await this.addToDividendPool(priceWithoutFee, currency);

    return response;
  }

  async applyMultiplier(userId, shopBox) {
    const response = {
      current: 0,
      previous: 0,
    };

    if (!shopBox.multiplier.max) return response;

    const user = await dbModel.users.findOne({ user_id: userId });
    const activeMultiplier = this.getActiveMultiplier(user.multipliers);

    response.previous = activeMultiplier ? activeMultiplier.value : 0;
    response.current = this.generateMultiplierRandomizer(shopBox);

    const isValidMultiplierByDate = this.getIsValidMultiplierByDate(
      activeMultiplier
    );

    if (
      !response.current ||
      (isValidMultiplierByDate && response.previous > response.current)
    ) {
      return response;
    }

    // Set all multipliers as inactive (active: false)
    await dbModel.users.updateOne(
      {
        user_id: userId,
        "multipliers.active": true,
      },
      {
        $set: {
          "multipliers.$[].active": false,
        },
      }
    );

    // Add the new active multiplier
    await dbModel.users.updateOne(
      {
        user_id: userId,
      },
      {
        $push: {
          multipliers: {
            value: response.current,
            appliedOn: new Date(),
            active: true,
            minedTokens: 0,
          },
        },
      }
    );

    return response;
  }

  getActiveMultiplier(userMultipliers = []) {
    return userMultipliers.find((multiplier) => multiplier.active);
  }

  getIsValidMultiplierByDate(userMultiplier) {
    if (!userMultiplier || !userMultiplier.appliedOn) {
      return false;
    }

    const now = new Date();
    const yesterday = new Date(now.setDate(now.getDate() - 1));
    const appliedOn = new Date(userMultiplier.appliedOn);

    return appliedOn > yesterday;
  }

  // TODO: Move to utils
  getPriceWithoutFee(price = 0) {
    if (!price) return 0;

    return price - price * SHOPPING_FEE;
  }

  getPriceShort(price = 0) {
    return price / powDivider;
  }

  async subtractFromBalance(userId, subtractAmount, currency) {
    const filter = {
      user_id: userId,
    };

    const wallet = await dbModel.wallet.findOne(filter);
    // TODO check if wallet exists first
    if (!wallet || !wallet.trx_wallet) {
      if (!hasEnoughMoney) {
        throw "Please deposit a sufficient amount in order to buy a box";
      }
    }

    const balancesService = new BalancesService();
    const balances = await balancesService.getWalletBalances(userId);
    let availableBalance = balances[currency];

    const hasEnoughMoney = availableBalance >= subtractAmount;
    const pow_div_curr = await balancesService.get_currmultiplier(currency);

    if (!hasEnoughMoney) {
      throw "Please deposit a sufficient amount in order to buy a box";
    }

    const doc = {
      $set: {
        [`${currency.toLowerCase()}_wallet.amount`]:
          (availableBalance - subtractAmount) * pow_div_curr,
      },
    };

    const options = {
      new: true,
    };

    const newBalance = await dbModel.wallet.findOneAndUpdate(
      filter,
      doc,
      options
    );
    const updated_balance = await balancesService.getWalletBalances(userId);

    const message = {
      balance: updated_balance[currency],
      address: userId,
      currency: currency,
    };

    io.emit("getBal", message);

    return newBalance;
  }

  async createNewShopTransaction(userId, shopBox, multiplierApplied = {}) {
    return dbModel.shopTransactions.create({
      userId,
      price: shopBox.price,
      currency: shopBox.currency,
      amount: shopBox.amount,
      multiplierApplied: multiplierApplied.current || 0,
    });
  }

  async addToDividendPool(amount, currency) {
    const poolService = new PoolService();
    const updatedSettings = await poolService.updatePoolAmount(
      amount,
      currency
    );
    io.emit("getdivi", { diviSettings: updatedSettings });
    return updatedSettings;
  }

  async getLatestShopTransaction(userId) {
    return dbModel.shopTransactions.findOne(
      { userId },
      {},
      { sort: { created_at: -1 } }
    );
  }

  getSecondsDifference(time1, time2 = new Date()) {
    const diffMs = time2 - time1;
    return Math.round(((diffMs % 86400000) % 3600000) / 1000); // seconds
  }

  async getBuyTimeRestriction(userId) {
    const latestShopTransaction = await this.getLatestShopTransaction(userId);

    if (!latestShopTransaction)
      return {
        restricted: false,
      };

    const lastTransactionDate = new Date(latestShopTransaction.created_at);
    const secondsDifference = this.getSecondsDifference(lastTransactionDate);

    const {
      shop_transactions_interval_limit_seconds,
    } = await dbModel.dividendSettings.findOne();

    const remainingSeconds =
      shop_transactions_interval_limit_seconds - secondsDifference;

    return {
      restricted: secondsDifference < shop_transactions_interval_limit_seconds,
      remainingSeconds,
    };
  }

  generateMultiplierRandomizer(shopBoxData) {
    const {
      multiplier: { min, max },
    } = shopBoxData;

    const minNum = Number(min) * 10;
    const maxNum = Number(max) * 10;

    const length = 54;
    const arr = Array.from({ length }).map(() => 0);

    // Randomly spread up to 5 numbers from range min and max.
    // Example:
    // arr: [
    //   0,   0, 0, 0, 0,   0, 0,   0, 0, 0, 0, 1.3,
    //   0,   0, 0, 0, 0, 1.3, 0,   0, 0, 0, 0, 1.3,
    //   0, 1.4, 0, 0, 0,   0, 0,   0, 0, 0, 0,   0,
    //   0,   0, 0, 0, 0,   0, 0, 1.4, 0, 0, 0,   0,
    //   0,   0, 0, 0, 0,   0
    // ],
    for (let i = 0; i < 5; i++) {
      const multiplier = integer(minNum, maxNum)(nodeCrypto) / 10;
      const index = integer(0, length - 1)(nodeCrypto);
      arr[index] = multiplier;
    }

    const luckyNumberIndex = integer(0, length - 1)(nodeCrypto);
    return arr[luckyNumberIndex];
  }
};
