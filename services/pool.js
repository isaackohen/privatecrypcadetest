const { dbModel } = require("../model/db");
const currencyCodes = require("../constants/currencyCodes");

const poolAmountKeysByCurrencyCodeMapping = {
  [currencyCodes.TRX]: {
    pool_amount: "pool_amount",
    fake_pool_amount: "fake_pool_amount",
  },
  [currencyCodes.MATIC]: {
    pool_amount: "matic_pool_amount",
    fake_pool_amount: "matic_fake_pool_amount",
  },
  [currencyCodes.ETH]: {
    pool_amount: "eth_pool_amount",
    fake_pool_amount: "eth_fake_pool_amount",
  },
};

module.exports = class PoolService {
  async getPoolAmountByCurrencyCode(currencyCode = currencyCodes.TRX) {
    const dividendSettings = await dbModel.dividendSettings.findOne();

    const poolAmountKeys = this.getPoolAmountKeysByCurrencyCode(currencyCode);

    const poolAmount = dividendSettings[poolAmountKeys.pool_amount];
    const fakePoolAmount = dividendSettings[poolAmountKeys.fake_pool_amount];

    return { poolAmount, fakePoolAmount };
  }

  async updatePoolAmount(amount, currencyCode = currencyCodes.TRX) {
    if (!amount) {
      throw "PoolService.updatePoolAmount(): Amount should be different than 0 (zero)";
    }
    if (!currencyCode) {
      throw "PoolService.updatePoolAmount(): currencyCode is not set";
    }

    const floatAmount = parseFloat(amount);

    const poolAmountKeysByCurrencyCode = this.getPoolAmountKeysByCurrencyCode(
      currencyCode
    );

    return dbModel.dividendSettings.findOneAndUpdate(
      {},
      {
        $inc: {
          [poolAmountKeysByCurrencyCode.pool_amount]: floatAmount,
          [poolAmountKeysByCurrencyCode.fake_pool_amount]: floatAmount,
        },
      },
      {
        new: true,
      }
    );
  }

  getPoolAmountKeysByCurrencyCode(currencyCode = currencyCodes.TRX) {
    return poolAmountKeysByCurrencyCodeMapping[currencyCode];
  }
};
