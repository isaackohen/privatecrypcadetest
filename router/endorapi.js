const express = require("express");
const crypto = require("crypto");
var shasum = crypto.createHash("sha1");
const router = express.Router();

const config = require("../config");
const common = require("../helpers/common");
const { dbModel } = require("../model/db");
const BalancesService = require("../services/balances");
const PoolService = require("../services/pool");
const { Console } = require("console");

router.get("/check", async function (req, res) {
  console.log("checkapicalling");
  //param, sign
  let data = req.query;
  try {
    if (data) {
      return res.json({
        nodeId: 777,
        param: "1ed91779-fcd5-4e0b-aa04-a364fb8171fb",
        sign: shasum.digest("hex"),
      });
    } else {
      return res.json({ status: false, error: "Invalid check response" });
    }
  } catch (e) {
    console.log("endorcheck", e);
  }
});

router.get("/session", async function (req, res) {
  console.log("sessionapicalling");
  let data = req.query;
  console.log("request", data);
  try {
    if (data) {

      const gid = data.token.substr(0,12);
      const uid = data.token.substr(12,12);
      const game_id = (gid).toLowerCase();
      const user_id = (uid).toLowerCase();

      const game_data = await dbModel.games.findOne({$where: 'this._id.str.match(/'+game_id+'/)' }).lean();

      const user_data = await dbModel.wallet.findOne({$where: 'this._id.str.match(/'+user_id+'/)' }).lean();

      if(game_data && user_data){
        return res.json({
          player: user_data._id,
          currency: "EUR",
          game: game_data.reference,
        });
      }else{
        return res.json({ status: false, error: "Invalid session response" });
      }
        
    } else {
      return res.json({ status: false, error: "Invalid session response" });
    }
  } catch (e) {
    console.log("endorsession", e);
  }
});

router.get("/balance", async (req, res) => {
  const data = req.query;
  try {
    let newbal = await usr_balance(data);
    if(newbal){
      return res.status(200).json({ balance: newbal });
    }else{
      return res.json({ status: false, error: "Invalid User" });
    }
    
  } catch (error) {
    console.log("getbalance", error);
  }
});

async function usr_balance(data) {
  let user_id = data.player;
  let token = data.token;
  const wallet_data = await dbModel.wallet.findOne({ _id: user_id });
  if(wallet_data){
    const tronAddr = wallet_data.user_id;
    const balancesService = new BalancesService();
    const balances = await balancesService.getWalletBalances(wallet_data.user_id);
    const cur = token.split("CADE")[1];
    const curr = (cur.substr(0,1)).trim();
    const currency = curr == 1 ? "TRX" : curr == 2 ? "ETH" : "MATIC";
    let curry = await common.eurconverter(currency);
    const userbalance = balances[currency];
    io.emit("getBal", {
      balance: userbalance,
      address: tronAddr,
      currency: currency,
    });
    let convuserbalance = parseFloat(userbalance) * parseFloat(curry);
    convuserbalance = convuserbalance.toFixed(3) * 1000;
    let convbal = convuserbalance.toString().replace(".", "");
    let newbal = parseInt(convbal) > 0 ? parseInt(convbal) : 0;
    return newbal;
  }
  
}

router.post("/win", async (req, res) => {
  const data = req.body;
  const user_id = data.player;
  const wallet_data = await dbModel.wallet.findOne({ _id: user_id });
  const tronAddr = wallet_data.user_id;
  const balancesService = new BalancesService();
  const token = data.token;
  const cur = token.split("CADE")[1];
  const curr = (cur.substr(0,1)).trim();
  const currency = curr == 1 ? "TRX" : curr == 2 ? "ETH" : "MATIC";
  let curry = await common.eurconverter(currency);
  try {
    const slotWin = await dbModel.slots
      .findOne({ roundid: data.id, trntype: "WIN" })
      .lean();
    if (!slotWin) {
        const pow_div_curr = await balancesService.get_currmultiplier("TRX");
        const winamt = (data.amount / 1000);
        const newwinamount = parseFloat(winamt) / parseFloat(curry);
        const winAmount = newwinamount > 0 ? newwinamount * pow_div_curr : 0;
       const gamedata = await dbModel.games.findOne({reference:data.game}).lean();
        const winData = {
          providerid: 3,
          gameid: data.gameId,
          gameName: gamedata.referenceName,
          md5: data.sign,
          amount: newwinamount,
          remotetranid: data.token,
          trntype: "WIN",
          roundid: data.betTransactionId,
          userid: data.player,
          finished: 0,
          roomid: data.token,
          freespin_id: data.betTransactionId,
          currency: currency,
        };
        await dbModel.slots.create(winData);
        const set = {
          $inc: { [`${currency.toLowerCase()}_wallet.amount`]: winAmount },
        };
        const wallet = await dbModel.wallet.findOneAndUpdate(
          {
            _id: data.player,
          },
          set,
          { new: true }
        );
        await updateShare(winData, tronAddr, currency);
        await common.slotwinmultipler(data.betTransactionId);
        let newbal = await usr_balance(data);
        let tranid = data.id ? data.id : "0";
        return res.status(200).json({ transactionId: tranid, balance: newbal });
    }

    
  } catch (error) {
    console.log("getbalance", error);
  }
});

router.post("/bet", async (req, res) => {
  const data = req.body;
  const user_id = data.player;
  const wallet_data = await dbModel.wallet.findOne({ _id: user_id });
  const tronAddr = wallet_data.user_id;
  const balancesService = new BalancesService();
  const token = data.token;
  const cur = token.split("CADE")[1];
  const curr = (cur.substr(0,1)).trim();
  const currency = curr == 1 ? "TRX" : curr == 2 ? "ETH" : "MATIC";
  let curry = await common.eurconverter(currency);
  try {
    const slotBet = await dbModel.slots
      .findOne({ roundid: data.id, trntype: "BET" })
      .lean();
    const refBet = await dbModel.slots
      .findOne({ roundid: data.id, trntype: "REFUND" })
      .lean();
    if (!slotBet) {
      let availablebal = await usr_balance(data);
      if (refBet) {
        let newbal = await usr_balance(data);
        return res
          .status(200)
          .json({ transactionId: data.id, balance: newbal });
      } else if (availablebal >= data.amount) {
        const pow_div_curr = await balancesService.get_currmultiplier(currency);
        const betamt = (data.amount / 1000);
        const newbetamount = parseFloat(betamt) / parseFloat(curry);
        const betAmount = newbetamount > 0 ? -newbetamount * pow_div_curr : 0;
        const gamedata = await dbModel.games.findOne({reference:data.game}).lean();
        const betData = {
          providerid: 3,
          gameid: data.gameId,
          gameName: gamedata.referenceName,
          md5: data.sign,
          amount: -newbetamount,
          remotetranid: data.token,
          trntype: "BET",
          roundid: data.id,
          userid: data.player,
          finished: 0,
          roomid: data.token,
          freespin_id: data.id,
          currency: currency,
        };
        await dbModel.slots.create(betData);
        const set = {
          $inc: { [`${currency.toLowerCase()}_wallet.amount`]: betAmount },
        };
        const wallet = await dbModel.wallet.findOneAndUpdate(
          {
            _id: data.player,
          },
          set,
          { new: true }
        );

       if(!data.bonusId){
        const tokenData = {
          userId: tronAddr,
          betAmount: newbetamount,
          game_type: 2,
          currency: currency,
        };
        await common.ticketSystem(tokenData);
        await common.placeToken(tokenData);
      }

        let newbal = await usr_balance(data);
        return res
          .status(200)
          .json({ transactionId: data.id, balance: newbal });
      } else {
        return res.status(402).json({
          code: "INSUFFICIENT_FUNDS",
          message: "Player has insufficient funds",
        });
      }
    }

    let newbal = await usr_balance(data);
    return res.status(200).json({ transactionId: data.id, balance: newbal });
  } catch (error) {
    console.log("getbalance", error);
  }
});

router.post("/refund", async (req, res) => {
  const data = req.body;
  const balancesService = new BalancesService();
  const token = data.token;
  const cur = token.split("CADE")[1];
  const curr = (cur.substr(0,1)).trim();
  const currency = curr == 1 ? "TRX" : curr == 2 ? "ETH" : "MATIC";
  let curry = await common.eurconverter(currency);
  try {
    const slotBet = await dbModel.slots
      .findOne({ roundid: data.id, trntype: "BET" })
      .lean();
    if (!slotBet) {
      const pow_div_curr = await balancesService.get_currmultiplier(currency);
      const betamt = (data.amount / 1000);
      const newbetamount = parseFloat(betamt) / parseFloat(curry);
      const betAmount = newbetamount > 0 ? -newbetamount * pow_div_curr : 0;
      const gamedata = await dbModel.games.findOne({reference:data.game}).lean();

      const betData = {
        providerid: 3,
        gameid: data.gameId,
        gameName: gamedata.referenceName,
        md5: data.sign,
        amount: -newbetamount,
        remotetranid: data.token,
        trntype: "REFUND",
        roundid: data.id,
        userid: data.player,
        finished: 0,
        roomid: data.token,
        freespin_id: data.id,
        currency: currency,
      };
      await dbModel.slots.create(betData);
      // const set = {$inc: {[`trx_wallet.amount`]: -betAmount}};
      // const wallet = await dbModel.wallet.findOneAndUpdate({
      // _id: "5f87094dbf5dbf4208dbd8d4",
      // }, set, { new: true });
    } else {
    
      const betData = {
        providerid: 3,
        gameid: data.gameId,
        gameName: gamedata.referenceName,
        md5: data.sign,
        amount: -newbetamount,
        remotetranid: data.token,
        trntype: "REFUND",
        roundid: data.id,
        userid: data.player,
        finished: 0,
        roomid: data.token,
        freespin_id: data.id,
        currency: currency,
      };
      await dbModel.slots.create(betData);

      const pow_div_curr = await balancesService.get_currmultiplier(currency);
      const betamt = (data.amount / 1000);
      const newbetamount = parseFloat(betamt) / parseFloat(curry);
      const betAmount = newbetamount > 0 ? -newbetamount * pow_div_curr : 0;
      const gamedata = await dbModel.games.findOne({reference:data.game}).lean();

      const set = {
        $inc: { [`${currency.toLowerCase()}_wallet.amount`]: betAmount },
      };
      const wallet = await dbModel.wallet.findOneAndUpdate(
        {
          _id: data.player,
        },
        set,
        { new: true }
      );

     let newbal = await usr_balance(data);
   
    }
    return res.status(200).json({ transactionId: data.id, balance: newbal });
  } catch (error) {
    console.log("getbalance", error);
  }
});

router.post("/endSession", async (req, res) => {
  try {
    return res.status(200).json({});
  } catch (error) {
    console.log("endsession", error);
  }
});

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

const updateShare = async (data, tronAddr, currency) => {
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
  for (let i = 0; i < slotsWin.length; i++) {
    slotWinAmount += +slotsWin[i].amount;
  }

  const slotBetAmount = slotsBet ? Math.abs(slotsBet.amount) : 0;
  const amountIncome = slotBetAmount - slotWinAmount;
  const win = slotWinAmount > 0 ? 1 : 0;

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
    betamount: slotBetAmount,
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
