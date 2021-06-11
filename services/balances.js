const { dbModel } = require("../model/db");
const currencyCodes = require("../constants/currencyCodes");

module.exports = class BalancesService {
  static powDivider(currency) {
    switch (currency) {
      case "TRX":
        return Math.pow(10, 6);
      case "mETH":
        return Math.pow(10, 15);
      case "ETH":
      case "MATIC":
      case "MA1":
      default:
        return Math.pow(10, 18);
    }
  }

  async get_currmultiplier(currency) {
    return BalancesService.powDivider(currency);
  }

  async getWalletBalances(userId) {
    if (!userId) {
      throw "BalancesService.getWalletBalances(userId = undefined)";
    }

    const wallet = await dbModel.wallet.findOne({ user_id: userId });
    if (!wallet) {
      throw "Invalid User";
    }

    return {
      [currencyCodes.TRX]:
        wallet.trx_wallet.amount /
        BalancesService.powDivider(currencyCodes.TRX),
      [currencyCodes.ETH]:
        wallet.eth_wallet.amount /
        BalancesService.powDivider(currencyCodes.ETH),
      [currencyCodes.mETH]:
        wallet.eth_wallet.amount /
        BalancesService.powDivider(currencyCodes.mETH),
      [currencyCodes.MATIC]:
        wallet.matic_wallet.amount /
        BalancesService.powDivider(currencyCodes.MATIC),
      [currencyCodes.MA1]:
        wallet.matic_wallet.amount /
        BalancesService.powDivider(currencyCodes.MA1),
    };
  }

  async setWalletBalance(userId, currency, newBalance, operation = "$set") {
    if (!userId) {
      throw "BalancesService.setWalletBalance(userId = undefined)";
    }

    if (!currency) {
      throw "BalancesService.setWalletBalance(userId, currency = undefined)";
    }

    if (!currencyCodes[currency]) {
      throw "BalancesService.setWalletBalance(userId, currency = notImplemented)";
    }

    const set = {
      [operation]: {
        [`${currency.toLowerCase()}_wallet.amount`]:
          newBalance * BalancesService.powDivider(currency),
      },
    };

    const wallet = await dbModel.wallet.findOneAndUpdate(
      {
        user_id: userId,
      },
      set,
      { new: true }
    );

    return (
      wallet[`${currency.toLowerCase()}_wallet`].amount /
      BalancesService.powDivider(currency)
    );
  }

  async addUserBalance(userId, currency, newBalance) {
    return this.setWalletBalance(userId, currency, newBalance, "$inc");
  }
};
