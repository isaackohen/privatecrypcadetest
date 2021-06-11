const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const async = require("async");
const { dbModel } = require("../model/db");
let common = require("../helpers/common");

router.post("/user_Upload", async function (req, res) {
  try {
    let data = req.body;
    let Newname = await dbModel.users.update(
      { user_id: data.user_id },
      { $set: data }
    );
    if (Newname) {
      res.json({ status: true, msg: "Successfully updated" });
    } else {
      res.json({ status: false, msg: "Error on updation" });
    }
  } catch (e) {
    res.json({ status: false });
    console.log("user_Upload", e);
  }
});

router.post("/get_betAmount", common.whitelistMiddleware, async function (
  req,
  res
) {
  try {
    let data = req.body;
    let betData;
    let wallets = await dbModel.wallet.findOne({ user_id: data.address });
    if (wallets) {
      betData = await dbModel.dice.aggregate([
        { $match: { userId: data.address } },
        { $group: { _id: null, betAmount: { $sum: "$betAmount" } } },
        {
          $lookup: {
            from: "Circle",
            pipeline: [
              { $match: { userId: data.address } },
              { $group: { _id: null, betAmount: { $sum: "$betAmount" } } },
            ],
            as: "Circle",
          },
        },
        { $unwind: "$Circle" },
        {
          $lookup: {
            from: "Slots",
            pipeline: [{ $match: { userid: wallets._id, trntype: "BET" } }],
            as: "Slots",
          },
        },
      ]);

      totaluserBalance(res, betData);
    } else {
      betData = "0.00";
      res.json({ status: true, data: betData });
    }
  } catch (e) {
    res.json({ status: false });
    console.log("get_betAmount", e);
  }
});

router.get("/wageramount", async function (req, res) {
  try {
    let data = await common.Wagerslotdata("list");
    res.json({
      status: true,
      wagerdata: data.wagerData,
      winnerdata: data.winnerData,
    });
  } catch (e) {
    res.json({ status: false });
    console.log("wageramount", e);
  }
});

router.post("/get_totalbetAmount", common.whitelistMiddleware, async function (
  req,
  res
) {
  try {
    let { address } = req.body;
    let wallets = await dbModel.wallet.findOne({ user_id: address });
    const data = wallets
      ? await common.totalBetAmount(wallets)
      : {
          TRX: 0,
          ETH: 0,
          MATIC: 0,
        };

    res.json({ status: true, data });
  } catch (e) {
    res.json({ status: false });
    console.log("get_totalbetAmount", e);
  }
});

router.post(
  "/get_totalRankbetAmount",
  common.whitelistMiddleware,
  async function (req, res) {
    try {
      let { address } = req.body;
      let wallets = await dbModel.wallet.findOne({ user_id: address });
      let divisett = await dbModel.dividendSettings.findOne().lean();
      const data = wallets
        ? await common.totalRankBetAmount(wallets)
        : {
            TRX: 0,
            ETH: 0,
            MATIC: 0,
          };

      const trx_betamount = data.TRX ? data.TRX : 0;
      const eth_betamount = data.ETH ? data.ETH * divisett.eth_trx : 0;
      const matic_betamount = data.MATIC ? data.MATIC * divisett.matic_trx : 0;
      const total_betamount =
        parseFloat(trx_betamount) +
        parseFloat(eth_betamount) +
        parseFloat(matic_betamount);
      res.json({ status: true, total_betamount });
    } catch (e) {
      res.json({ status: false });
      console.log("get_totalRankbetAmount", e);
    }
  }
);

async function totaluserBalance(res, betData) {
  let value;
  if (betData.length > 0) {
    if (betData[0].Slots.length > 0) {
      let SlotAmount = 0;
      betData[0].Slots.map(function (item) {
        let intvalue = Number(item.amount);
        let absolute = Math.abs(intvalue);
        SlotAmount = absolute + SlotAmount;
        value = betData[0].betAmount + betData[0].Circle.betAmount + SlotAmount;
      });
    } else if (betData[0].Circle.betAmount) {
      value = betData[0].betAmount + betData[0].Circle.betAmount;
    } else {
      value = betData[0].betAmount;
    }
    res.json({ status: true, data: value });
  } else {
    betData = "0.00";
    res.json({ status: true, data: betData });
  }
}

router.post("/get_history", common.whitelistMiddleware, async function (
  req,
  res
) {
  let DB;
  try {
    let value = req.body;
    if (value.history == "Deposit") {
      DB = require("../model/db/deposit");
    } else if (value.history == "Withdraw") {
      DB = require("../model/db/move");
    } else {
      return res.json({ status: false, message: "Error" });
    }
    let pageNo = value.pageNo;
    let size = parseInt(value.size);
    let query = { userId: value.address };
    let skips = size * (pageNo - 1);
    let limits = size;
    let totalCount = await DB.find(query).count();
    var History = await DB.find(query)
      .skip(skips)
      .limit(limits)
      .sort({ createddate: -1 });
    if (History) {
      res.json({ status: true, data: History, count: totalCount });
    } else {
      res.json({ status: false, message: "No data found" });
    }
  } catch (e) {
    res.json({ status: false });
    console.log("get_history", e);
  }
});

router.post("/get_datehistory", common.whitelistMiddleware, async function (
  req,
  res
) {
  let DB;
  try {
    let value = req.body;
    if (value.history == "Deposit") {
      DB = require("../model/db/deposit");
    } else if (value.history == "Withdraw") {
      DB = require("../model/withdraw");
    } else {
      return res.json({ status: false, message: "Error" });
    }
    console.log(req.body);
    var History = await DB.find({
      $and: [
        { createddate: { $gte: value.startdate } },
        { endDate: { $lte: value.enddate } },
      ],
    });
    if (History.length > 0) {
      console.log(History);
      res.json({ status: true, data: History });
    } else {
      res.json({ status: false, message: "No data found" });
    }
  } catch (e) {
    res.json({ status: false });
    console.log("get_datehistory", e);
  }
});

router.post("/update_user_rank", common.tokenMiddleware, async function (
  req,
  res
) {
  let data = req.body;
  try {
    let update = await dbModel.users.update(
      { user_id: req.genuserId },
      { $set: { rank: data.rank, rankName: data.rankName } }
    );
    if (update) {
      res.json({ status: true, msg: "User`s rank updated Successfully" });
    } else {
      res.json({ status: false });
    }
  } catch (e) {
    console.log(e, "update_user_rank");
  }
});

module.exports = router;
