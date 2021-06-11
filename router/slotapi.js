const express = require("express");
const router = express.Router();

const config = require("../config");
const common = require("../helpers/common");
const { dbModel } = require("../model/db");
const BalancesService = require("../services/balances");
const PoolService = require("../services/pool");

const {
  getFrequentBet,
  setFrequentBet,
  setBongoRequest,
  getBongoRequest,
} = require("../helpers/redis");

router.get("/get_slot", async (req, res) => {
  try {
    const slotData = await dbModel.slots.find();
    if (slotData) {
      res.json({ status: true, data: slotData });
    } else {
      res.json({ status: false });
    }
  } catch (error) {
    console.log("get_id", error);
  }
});

router.post("/slot_userlist", async (req, res) => {
  const data = req.body;
  try {
    const skips = data.size * (data.pageNo - 1);
    const wallet = await dbModel.wallet
      .findOne({ user_id: data.user_id })
      .lean();
    const query = { userid: wallet._id };
    if (wallet) {
      const totalCount = await dbModel.slots.find(query).count();
      const slotData = await dbModel.slots
        .find(query)
        .skip(skips)
        .limit(data.size)
        .sort({ _id: -1 })
        .lean();
      slotData.map((item) => {
        item.amount = Math.abs(item.amount).toFixed(2);
      });
      res.json({ status: true, data: slotData, count: totalCount });
    } else {
      res.json({ status: false });
    }
  } catch (error) {
    console.log("get_id", error);
  }
});

router.post("/getbalance", async (req, res) => {
  const data = req.body;
  try {
    const wallet_data = await dbModel.wallet.findOne({ _id: data.userid });
    const balancesService = new BalancesService();
    const balances = await balancesService.getWalletBalances(
      wallet_data.user_id
    );
    let userbal = balances[data.token];
    res.json({ successCode: 0, balance: userbal });
  } catch (error) {
    console.log("getbalance", error);
  }
});

router.post("/betwin", async (req, res) => {
  const data = req.body;
  try {
    const balancesService = new BalancesService();
    const slotBet = await dbModel.slots
      .findOne({ roundid: data.roundid, trntype: "BET" })
      .lean();
    const wallet = await dbModel.wallet.findOne({ _id: data.userid }).lean();
    const userRef = await dbModel.users
      .findOne({ user_id: wallet.user_id })
      .lean();
    data.rank = userRef.rank;
    const currency = data.token == "mETH" ? "ETH" : data.token;
    data.currency = currency;
    const profit_upd = 0;
    const pow_div_curr = await balancesService.get_currmultiplier(data.token);
    const Amount = Number(data.amount);
    const AbsAmount = Math.abs(Amount);
    const betAmount = Amount * pow_div_curr;
    const Absolute = Math.abs(betAmount);

    if (data.trntype == "WIN") {
      await slotUpdate(res, data, betAmount, Absolute);
      await updateShare(data, wallet.user_id);
      return;
    }

    if (data.trntype == "BET" && !slotBet) {
      const wallet = await dbModel.wallet.findOne({ _id: data.userid });
      const wallet_balance = await balancesService.getWalletBalances(
        wallet.user_id
      );
      const walletuserbal = wallet_balance[data.token];
      wallet &&
        walletuserbal >= AbsAmount &&
        (await slotUpdate(res, data, betAmount, Absolute));
      return;
    }

    return res.json({ "/betwin": -110 });
  } catch (error) {
    console.log("betwin", error);
  }
});

router.post("/getname", async (req, res) => {
  const data = req.body;
  try {
    const wallet = await dbModel.wallet.findOne({ _id: data.userid });
    if (wallet) {
      res.json({ userid: data.userid, username: wallet.user_id });
    } else {
      res.json({ "/getname": -102 });
    }
  } catch (error) {
    console.log("getname", error);
  }
});

router.post("/refund", async (req, res) => {
  const data = req.body;
  const balancesService = new BalancesService();
  const pow_div_curr = await balancesService.get_currmultiplier(data.token);
  if (data.trntype !== "RESTORE") {
    return res.json({ "/refund": -100 });
  }

  const wallet = await dbModel.wallet.findOne({ _id: data.userid }).lean();
  if (!wallet || !wallet.trx_wallet) return res.json({ "/refund": -105 });

  const user_ref = await dbModel.users
    .findOne({ user_id: wallet.user_id })
    .lean();
  data.rank = user_ref.rank;
  const absolute = Number(data.amount) * pow_div_curr;
  const betAmount = Math.abs(absolute);

  try {
    await slotUpdate(res, data, betAmount, absolute);
  } catch (error) {
    console.log("refund", error);
  }
});

router.post("/freespin", async (req, res) => {
  const data = req.body;
  const wallet = await dbModel.wallet.findOne({ _id: data.userid }).lean();
  const user_ref = await dbModel.users
    .findOne({ user_id: wallet.user_id })
    .lean();
  data.rank = user_ref.rank;

  const balancesService = new BalancesService();
  const pow_div_curr = await balancesService.get_currmultiplier(data.token);

  try {
    const betAmount = Number(data.amount) * pow_div_curr;
    await slotUpdate(res, data, betAmount, 0);
    await updateShare(data.wallet.user_id);
  } catch (error) {
    console.log("freespin", error);
  }
});

const slotUpdate = async (res, data, betAmount, absolute) => {
  const balancesService = new BalancesService();
  const wallet_data = await dbModel.wallet.findOne({ _id: data.userid });
  const currency = data.token == "mETH" ? "ETH" : data.token;
  const pow_div_curr = await balancesService.get_currmultiplier(currency);
  const set = {
    $inc: { [`${currency.toLowerCase()}_wallet.amount`]: betAmount },
  };
  const wallet = await dbModel.wallet.findOneAndUpdate(
    {
      _id: data.userid,
    },
    set,
    { new: true }
  );
  await dbModel.slots.create(data);
  const balances = await balancesService.getWalletBalances(wallet_data.user_id);
  const ints = balances[data.token];
  const intss = balances[currency];
  if (data.trntype == "BET") {
    const obj = {
      userId: wallet.user_id,
      betAmount: absolute / pow_div_curr,
      game_type: 2, //For In-house game type 1
      currency: currency,
    };
    await common.ticketSystem(obj);
    await common.placeToken(obj);

    io.emit("getBal", {
      balance: intss,
      address: wallet.user_id,
      currency: currency,
    });

    io.emit("rankUpgrade", { address: wallet.user_id });
    res.json({ successCode: 0, balance: ints });
  } else {
    if (data.trntype == "WIN" && data.amount != "0.00") {
      await common.slotwinmultipler(data.roundid);
      const allData = await common.allWinnerdata();
      io.emit("allGameData", allData);
    }
    io.emit("getBal", {
      balance: intss,
      address: wallet.user_id,
      currency: currency,
    });
    res.json({ successCode: 0, balance: ints });
  }
};

const updateShare = async (data, tronAddr) => {
  const poolService = new PoolService();
  const divisett = await dbModel.dividendSettings.findOne();
  const slotSettings = await dbModel.slotSettings.findOne();
  const slotsBet = await dbModel.slots
    .findOne({ roundid: data.roundid, trntype: "BET" })
    .lean();
  const slotsWin = await dbModel.slots.find({
    roundid: data.roundid,
    trntype: "WIN",
  });
  let slotWinAmount = 0;
  const currency = data.token == "mETH" ? "ETH" : data.token;

  slotsWin.map((slot) => {
    slotWinAmount += +slot.amount;
  });

  const slotBetAmount = slotsBet ? Math.abs(slotsBet.amount) : 0;

  const slotBetAmountNw =
    data.token == "mETH" ? slotBetAmount / Math.pow(10, 3) : slotBetAmount;
  const slotWinAmountNw =
    data.token == "mETH" ? slotWinAmount / Math.pow(10, 3) : slotWinAmount;
  const amountIncome = slotBetAmountNw - slotWinAmountNw;
  const win = slotWinAmountNw > 0 ? 1 : 0;
  const shareAmount =
    amountIncome > 0 ? (slotSettings.platipus_share / 100) * amountIncome : 0;
  const amountUpdate =
    amountIncome > 0 ? amountIncome - shareAmount : Math.abs(amountIncome);
  const sharePlatipus = amountIncome > 0 ? slotSettings.platipus_share : 0;
  const inAmount = amountIncome > 0 ? amountUpdate : 0;
  const outAmount = amountIncome > 0 ? 0 : amountUpdate;

  const amountToAddToPool = amountIncome > 0 ? amountUpdate : -amountUpdate;
  const updatedSettings = await poolService.updatePoolAmount(
    amountToAddToPool,
    currency
  );
  io.emit("getdivi", { diviSettings: updatedSettings });
  const poolAmountKeysByCurrencyCode = poolService.getPoolAmountKeysByCurrencyCode(
    currency
  );
  const realOrg = divisett[poolAmountKeysByCurrencyCode.pool_amount];
  const fakeOrg = divisett[poolAmountKeysByCurrencyCode.fake_pool_amount];
  const updatedPool = updatedSettings[poolAmountKeysByCurrencyCode.pool_amount];
  const updatedFakePool =
    updatedSettings[poolAmountKeysByCurrencyCode.fake_pool_amount];

  const wallet = await dbModel.wallet.findOne({ _id: data.userid }).lean();
  const getProfit = await common.update_profit(wallet.user_id);

  const platiShareObj = {
    userid: tronAddr,
    game: data.game_name,
    betamount: amountIncome,
    shared_percentage: sharePlatipus,
    shared_amount: shareAmount,
  };
  amountIncome > 0 && (await dbModel.platiShare.create(platiShareObj));

  const poolDataObj = {
    userid: tronAddr,
    game: "Slots",
    betamount: slotBetAmountNw,
    win: win,
    in_amt: inAmount,
    out_amt: outAmount,
    real_org: realOrg,
    fake_org: fakeOrg,
    real_mod: updatedPool,
    fake_mod: updatedFakePool,
    shared_percentage: sharePlatipus,
    shared_amount: shareAmount,
  };
  await dbModel.share.create(poolDataObj);
};

module.exports = router;
