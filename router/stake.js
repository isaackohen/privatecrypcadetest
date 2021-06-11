const express = require("express");
const router = express.Router();
const { dbModel } = require("../model/db");
const common = require("../helpers/common");
const BalancesService = require("../services/balances");
const PoolService = require("../services/pool");
const currencyCodes = require("../constants/currencyCodes");
const { async } = require("@babel/runtime/regenerator");
const TronWeb = require("tronweb");
const config = require("../config");
const { decrypt } = require("../helpers/common");

router.post("/stakecreate", common.tokenMiddleware, async function (req, res) {
  var data = req.body;
  try {
    let userId = req.genuserId;
    const balancesService = new BalancesService();
    const wallet_data = await dbModel.wallet.findOne({ user_id: userId });
    const stack_data = await dbModel.staking
      .findOne({ userId: userId, status: 0 })
      .lean();
    const balances = await balancesService.getWalletBalances(
      wallet_data.user_id
    );
    let userbal = balances[data.currency];
    let calBal = parseFloat(userbal) - parseFloat(data.amount);
    const bean_data = await dbModel.bean.findOne({ userId: userId }).lean();

    if (data.currency != "TRX") {
      res.json({
        status: false,
        error: "Staking not allowed for this currency",
      });
      return false;
    }

    if (data.autoOption < 0 || data.autoOption > 2) {
      res.json({ status: false, error: "Invalid auto Option" });
      return false;
    }

    if (stack_data) {
      res.json({ status: false, error: "You are already in a staking round" });
      return false;
    }

    if (!userId || !wallet_data) {
      res.json({ status: false, error: "Please Login to staking" });
      return false;
    }

    if (!bean_data || bean_data.freeze < 10) {
      res.json({
        status: false,
        error: "User must had atleast 10 beans freeze tokens",
      });
      return false;
    }

    if (data.amount <= 0) {
      res.json({ status: false, error: "Invalid Staking Amount" });
      return false;
    }

    if (data.periods <= 0) {
      res.json({ status: false, error: "Invalid Staking Periods" });
      return false;
    }

    if (data.profit <= 0) {
      res.json({ status: false, error: "Invalid Staking Profit" });
      return false;
    }

    if (userbal < data.amount) {
      res.json({ status: false, error: "Insufficient Balance" });
      return false;
    }

    if (calBal >= 0) {
      let currency = data.currency;
      let stakeprofit = stakeprofit_calculation(
        data.amount,
        data.periods,
        bean_data.freeze
      );
      let profit = parseFloat(stakeprofit);
      if (profit <= 0) {
        res.json({ status: false, error: "Invalid Profit" });
        return false;
      }

      const newUserBalance = await balancesService.setWalletBalance(
        userId,
        currency,
        calBal
      );
      const stack_data = {
        userId: userId,
        amount: data.amount,
        periods: data.periods,
        currency: data.currency,
        status: 0,
        autoOption: data.autoOption,
        profit: profit.toFixed(2),
        tokens: bean_data.freeze,
      };

      io.emit("getBal", {
        balance: newUserBalance,
        address: userId,
        currency: currency,
      });
      let stack_create = await dbModel.staking.create(stack_data);
      if (stack_create) {
        res.json({ status: true });
      }
    }
  } catch (e) {
    res.json({ status: false, error: e });
    console.log("stakecreate", e);
  }
});

function stakeprofit_calculation(amount, periods, beantoken) {
  let profit = 0;
  switch (periods) {
    case 7:
      profit = (amount * ((2.75 + 0.0001 * beantoken) / 30) * 7) / 100;
      break;
    case 14:
      profit = (amount * ((2.85 + 0.0001 * beantoken) / 30) * 14) / 100;
      break;
    case 30:
      profit = (amount * (3.0 + 0.0001 * beantoken)) / 100;
      break;
  }
  return profit;
}

router.post("/getstake", common.tokenMiddleware, async function (req, res) {
  let data = req.body;
  try {
    let userId = req.genuserId;
    const stack_data = await dbModel.staking
      .findOne({ userId: userId, status: 0 })
      .lean();
    if (stack_data) {
      res.json({ status: true, data: stack_data });
    } else {
      res.json({ status: false });
    }
  } catch (e) {
    res.json({ status: false, error: e });
    console.log("getstake", e);
  }
});

router.post("/getbeantoken", common.tokenMiddleware, async function (req, res) {
  let data = req.body;
  try {
    let userId = req.genuserId;
    const bean_data = await dbModel.bean.findOne({ userId: userId }).lean();
    if (bean_data) {
      res.json({ status: true, data: bean_data });
    } else {
      res.json({ status: false });
    }
  } catch (e) {
    res.json({ status: false, error: e });
    console.log("getbeantoken", e);
  }
});

router.post("/collectstakeprofit", common.tokenMiddleware, async function (
  req,
  res
) {
  let data = req.body;
  try {
    let userId = req.genuserId;
    let currency = data.currency;
    let shareAmount = 0;

    const share = await dbModel.stakeprofit.aggregate([
      { $match: { expiry_status: 0, userId: userId, period: data.periods } },
      { $group: { _id: null, amount: { $sum: "$profit" } } },
    ]);

    if (share[0] && share[0].amount) {
      shareAmount = +share[0].amount;
    }

    if (shareAmount > 0) {
      const balancesService = new BalancesService();
      const wallet_data = await dbModel.wallet.findOne({ user_id: userId });

      const balances = await balancesService.getWalletBalances(
        wallet_data.user_id
      );
      let userbal = balances[data.currency];
      let calBal = parseFloat(userbal) + parseFloat(shareAmount);

      const newUserBalance = await balancesService.setWalletBalance(
        userId,
        currency,
        calBal
      );
      if (newUserBalance) {
        io.emit("getBal", {
          balance: newUserBalance,
          address: userId,
          currency: currency,
        });
        let profit_data = {
          userId: userId,
          amount: shareAmount,
          periods: data.periods,
          currency: currency,
        };
        await dbModel.stakeprofit.updateMany(
          { expiry_status: 0, userId: userId, period: data.periods },
          { $set: { expiry_status: 1 } }
        );
        let profit_create = await dbModel.stakeprofitcollect.create(
          profit_data
        );
        if (profit_create) {
          res.json({ status: true });
        }
      }
    } else {
      res.json({ status: false, error: "Invalid Share Amount" });
    }
  } catch (e) {
    res.json({ status: false, error: e });
    console.log("collectstakeprofit", e);
  }
});

router.post("/getstakeprofit", common.tokenMiddleware, async function (
  req,
  res
) {
  let data = req.body;
  try {
    let userId = req.genuserId;
    let shareAmount = 0;

    const share = await dbModel.stakeprofit.aggregate([
      { $match: { expiry_status: 0, userId: userId, period: data.period } },
      { $group: { _id: null, amount: { $sum: "$profit" } } },
    ]);

    if (share[0] && share[0].amount) {
      shareAmount = +share[0].amount;
    }

    if (shareAmount) {
      res.json({ status: true, data: shareAmount });
    } else {
      res.json({ status: false, data: 0 });
    }
  } catch (e) {
    res.json({ status: false, error: e });
    console.log("getstakeprofit", e);
  }
});

router.post("/updatetoken", common.tokenMiddleware, async function (req, res) {
  try {
    let tokenUpdated = await common.update_beantoken(req);
    res.json(tokenUpdated);
  } catch (e) {
    res.json({ status: false });
    console.log("updatetoken", e);
  }
});

router.post("/updatetokenaction", common.tokenMiddleware, async function (
  req,
  res
) {
  try {
    let tokenUpdated = await common.update_beantokenaction(req);
    res.json(tokenUpdated);
  } catch (e) {
    res.json({ status: false });
    console.log("updatetokenaction", e);
  }
});

router.post("/tokenstatus", common.tokenMiddleware, async function (req, res) {
  try {
    const beanTab = await dbModel.bean
      .find({
        userId: req.genuserId,
        updatedDate: { $gt: new Date(Date.now() - 1000 * 60 * 10) },
      })
      .count();
    if (beanTab) {
      res.json({ status: false, error: "Try After 10 mins" });
      return false;
    } else {
      res.json({ status: true });
    }
  } catch (e) {
    res.json({ status: false });
    console.log("tokenstatus", e);
  }
});

router.post("/updateauto", common.tokenMiddleware, async function (req, res) {
  let data = req.body;
  try {
    let autoupdate = await dbModel.staking.updateOne(
      { _id: data.id },
      { $set: { autoOption: data.autoOption } }
    );
    if (autoupdate) {
      res.json({ status: true });
    } else {
      res.json({ status: false });
    }
  } catch (e) {
    res.json({ status: false });
    console.log("updateauto", e);
  }
});

module.exports = router;
