const express = require("express");
var mongoose = require("mongoose");
const router = express.Router();
var referal_share = require("../model/db/gaugeshare");
var referal_cade = require("../model/db/gaugecade");
var async = require("async");
var common = require("../helpers/common");

router.get("/get_unremmedlist", common.whitelistMiddleware, async function (
  req,
  res
) {
  try {
    var totalData = await referal_share.aggregate([
      { $match: { status: 0 } },
      { $group: { _id: "$ruserId", amount: { $sum: "$received_amount" } } },
    ]);
    res.json({ status: true, data: totalData });
  } catch (e) {
    res.json({ status: false });
    console.log("get_unremmed", e);
  }
});

router.get("/get_unremmed", common.whitelistMiddleware, async function (
  req,
  res
) {
  try {
    var totalData = await referal_share.aggregate([
      { $match: { status: 0 } },
      { $group: { _id: null, amount: { $sum: "$received_amount" } } },
    ]);
    if (totalData[0] && totalData[0].amount) {
      var total_amt = totalData[0].amount;
    } else {
      var total_amt = 0;
    }
    res.json({ status: true, data: total_amt });
  } catch (e) {
    res.json({ status: false });
    console.log("get_unremmed", e);
  }
});

router.get("/get_refsharelist", common.whitelistMiddleware, async function (
  req,
  res
) {
  try {
    var shareData = await referal_share.find().sort({ createddate: -1 });
    res.json({ status: true, data: shareData });
  } catch (e) {
    res.json({ status: false });
    console.log("get_refsharelist", e);
  }
});

router.post("/get_refshareamount", common.tokenMiddleware, async function (
  req,
  res
) {
  try {
    var totalData = await referal_share.aggregate([
      { $match: { ruserId: req.body.userId, status: 0 } },
      { $group: { _id: null, amount: { $sum: "$received_amount" } } },
    ]);
    if (totalData[0] && totalData[0].amount) {
      var new_amt = totalData[0].amount;
    } else {
      var new_amt = 0;
    }
    res.json({ status: true, data: new_amt });
  } catch (e) {
    res.json({ status: false });
    console.log("get_refshareamount", e);
  }
});

router.post("/get_trxreffshareamount", common.tokenMiddleware, async function (
  req,
  res
) {
  try {
    var totalData = await referal_share.aggregate([
      { $match: { ruserId: req.body.userId, status: 0, currency: "TRX" } },
      { $group: { _id: null, amount: { $sum: "$received_amount" } } },
    ]);
    if (totalData[0] && totalData[0].amount) {
      var new_amt = totalData[0].amount;
    } else {
      var new_amt = 0;
    }
    res.json({ status: true, data: new_amt });
  } catch (e) {
    res.json({ status: false });
    console.log("get_trxreffshareamount", e);
  }
});

router.post(
  "/get_maticreffshareamount",
  common.tokenMiddleware,
  async function (req, res) {
    try {
      var totalData = await referal_share.aggregate([
        { $match: { ruserId: req.body.userId, status: 0, currency: "MATIC" } },
        { $group: { _id: null, amount: { $sum: "$received_amount" } } },
      ]);
      if (totalData[0] && totalData[0].amount) {
        var new_amt = totalData[0].amount;
      } else {
        var new_amt = 0;
      }
      res.json({ status: true, data: new_amt });
    } catch (e) {
      res.json({ status: false });
      console.log("get_maticreffshareamount", e);
    }
  }
);

router.get("/get_tokentotal", common.whitelistMiddleware, async function (
  req,
  res
) {
  try {
    var totalData = await referal_cade.aggregate([
      { $match: {} },
      { $group: { _id: null, amount: { $sum: "$token_count" } } },
    ]);
    if (totalData[0] && totalData[0].amount) {
      var total_amt = totalData[0].amount;
    } else {
      var total_amt = 0;
    }
    res.json({ status: true, data: total_amt });
  } catch (e) {
    res.json({ status: false });
    console.log("get_tokentotal", e);
  }
});

router.get("/get_cadelist", common.whitelistMiddleware, async function (
  req,
  res
) {
  try {
    var totalData = await referal_cade.aggregate([
      { $match: {} },
      { $group: { _id: "$userId", amount: { $sum: "$token_count" } } },
    ]);
    res.json({ status: true, data: totalData });
  } catch (e) {
    res.json({ status: false });
    console.log("get_unremmed", e);
  }
});

router.post("/get_cadereflist", common.whitelistMiddleware, async function (
  req,
  res
) {
  try {
    var totalData = await referal_cade.aggregate([
      { $match: {} },
      { $group: { _id: "", amount: { $sum: "$token_count" } } },
    ]);
    res.json({ status: true, data: totalData });
  } catch (e) {
    res.json({ status: false });
    console.log("get_unremmed", e);
  }
});

module.exports = router;
