const express = require("express");
var mongoose = require("mongoose");
const router = express.Router();
const { dbModel } = require("../model/db");
var async = require("async");
var common = require("../helpers/common");
const db = require("../model/db");

router.get("/get_promotioncms", common.whitelistMiddleware, async function (
  req,
  res
) {
  try {
    var promtionData = await dbModel.cms
      .findOne({ heading: "Promotion" })
      .lean();
    res.json({ status: true, data: promtionData });
  } catch (e) {
    res.json({ status: false });
    console.log("get_promotioncms", e);
  }
});

router.get("/get_dicecms", common.whitelistMiddleware, async function (
  req,
  res
) {
  try {
    var promtionData = await dbModel.cms
      .findOne({ heading: "DicePromotion" })
      .lean();
    res.json({ status: true, data: promtionData });
  } catch (e) {
    res.json({ status: false });
    console.log("get_dicecms", e);
  }
});

router.get("/get_eventdate", common.whitelistMiddleware, async function (
  req,
  res
) {
  try {
    var eventData = await dbModel.ticketsystem.findOne({ status: 1 }).lean();
    res.json({ status: true, data: eventData });
  } catch (e) {
    res.json({ status: false });
    console.log("get_eventdate", e);
  }
});

router.post("/get_userticket", async function (req, res) {
  let data = req.body;
  try {
    var ticketData = await dbModel.ticket.findOne({ userId: data.userId });
    res.json({ status: true, data: ticketData });
  } catch (e) {
    res.json({ status: false });
    console.log("get_userticket", e);
  }
});

router.post("/get_ticketdata", async function (req, res) {
  let data = req.body;
  try {
   // var ticketData = await dbModel.ticket.find().sort({tickets: -1}).limit(5);
   var ticketData = await dbModel.ticket.aggregate([
      {$sort: {"tickets": -1}},
      { $limit: 10 },
      {$lookup: {from: "Users", localField: "userId", foreignField: "user_id", as: "user_docs"}},
      ]);
    res.json({ status: true, data: ticketData });
  } catch (e) {
    res.json({ status: false });
    console.log("get_ticketdata", e);
  }
});

router.post("/get_dicedata", async function (req, res) {
  let data = req.body;
  try {
   var diceData = await dbModel.dicewinmultiplier.aggregate([
      {$sort: {"multiplier": -1}},
      { $limit: 10 },
      {$lookup: {from: "Users", localField: "userId", foreignField: "user_id", as: "user_docs"}},
      ]);
    res.json({ status: true, data: diceData });
  } catch (e) {
    res.json({ status: false });
    console.log("get_dicedata", e);
  }
});

router.get("/get_totalticket", common.whitelistMiddleware, async function (
  req,
  res
) {
  try {
    var totalData = await dbModel.ticket.aggregate([
      { $match: {} },
      { $group: { _id: null, ticket: { $sum: "$tickets" } } },
    ]);
    if (totalData) {
      res.json({ status: true, data: totalData[0].ticket });
    } else {
      res.json({ status: true, data: 0 });
    }
  } catch (e) {
    res.json({ status: false });
    console.log("get_totalticket", e);
  }
});

module.exports = router;
