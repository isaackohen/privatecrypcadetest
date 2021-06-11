const express = require("express");
var mongoose = require("mongoose");
const router = express.Router();
var betCountTab = require("../model/db/shotCount");
var dividendSettings = require("../model/db/rewardSettings");
var tokenMining = require("../model/db/Manage");
var async = require("async");
const TronWeb = require("tronweb");
var config = require("../config");
const siteSettings = require("../model/db/framework");
const dividendPool = require("../model/db/reward");
const common = require("../helpers/common");

router.get("/get_Alltoken", common.whitelistMiddleware, async function (
  req,
  res
) {
  try {
    var allMiningData = await tokenMining.aggregate([
      { $unwind: "$Cad_token" },
      { $match: { "Cad_token.type": "mined" } },
      { $group: { _id: null, mined_amount: { $sum: "$Cad_token.amount" } } },
    ]);
    res.json({ status: true, data: allMiningData });
  } catch (e) {
    res.json({ status: false });
    console.log("get_token", e);
  }
});

router.post(
  "/get_betCount",
  common.tokenMiddleware,
  common.tokenMiddleware,
  async function (req, res) {
    try {
      var betCountData = await betCountTab.find({ userId: req.body.userId });
      res.json({ status: true, data: betCountData });
    } catch (e) {
      res.json({ status: false });
      console.log("get_betCount", e);
    }
  }
);

router.post("/get_token", common.tokenMiddleware, async function (req, res) {
  try {
    var tokenMiningData = await tokenMining.findOne({
      userId: req.body.userId,
    });
    res.json({ status: true, data: tokenMiningData });
  } catch (e) {
    res.json({ status: false });
    console.log("get_token", e);
  }
});

router.post("/get_profit", common.tokenMiddleware, async function (req, res) {
  try {
    // let userData = await tokenMining.find();
    // var tokenMiningData = await tokenMining.findOne({userId:req.body.userId});
    // let settings = await dividendSettings.findOne().lean();
    // var total_tokn = 0;
    // if(settings.fake_pool_amount>0){
    // 	var initial_amount = settings.fake_pool_amount;
    // 	if(userData){
    //       for(let i=0; i<userData.length; i++){
    //         if(userData[i].Cad_token[3].type == 'unfreeze' && userData[i].Cad_token[3].amount){
    //           var total_tokn = parseFloat(total_tokn)+userData[i].Cad_token[3].amount;
    //         }
    //       }if(settings.user_percent>0 && tokenMiningData){
    //       	if(tokenMiningData.Cad_token[3].type == 'unfreeze' && tokenMiningData.Cad_token[3].amount){
    //       		var amt = parseFloat(tokenMiningData.Cad_token[3].amount)/parseFloat(total_tokn);
    //       		var day_amt = parseFloat(amt) * parseFloat(settings.user_percent/100)*parseFloat(settings.fake_pool_amount);
    //       		var month_amt = parseFloat(day_amt)*30;
    //       		res.json({status:true,data:{"day_data":day_amt,"month_data":month_amt}});

    //       	}else{
    //       		res.json({status:true,data:{"day_data":0,"month_data":0}});
    //       	}

    //       }else{
    //       	res.json({status:true,data:{"day_data":0,"month_data":0}});
    //       }
    //   		}else{
    //   			res.json({status:true,data:{"day_data":0,"month_data":0}});
    //   		}

    // }else{
    // 	res.json({status:true,data:{"day_data":0,"month_data":0}});
    // }
    let profit = await common.update_profit(req.body.userId);
    res.json(profit);
  } catch (e) {
    res.json({ status: false });
    console.log("get_token", e);
  }
});

router.post("/add_betCount", common.tokenMiddleware, async function (req, res) {
  var data = req.body;
  try {
    await common.placeToken(data);
    res.json({ status: true });
  } catch (e) {
    res.json({ status: false });
    console.log("add_betCount", e);
  }
});

router.post("/updateTokenMining", common.tokenMiddleware, async function (
  req,
  res
) {
  let data = req.body;
  let update;
  let update1;
  data.amount = parseFloat(data.amount);
  var tkn_detail = await tokenMining.findOne({ userId: req.genuserId }).lean();
  var divisett = await dividendSettings.findOne().lean();
  if (!data.amount || isNaN(data.amount) || data.amount <= 0) {
    res.json({ status: false });
    return false;
  }
  if (parseFloat(divisett.min_freezeAmount) > parseFloat(data.amount)) {
    res.json({ status: false });
    return false;
  }
  try {
    if (data.type == "transfer") {
      update = "mined";
      update1 = "freeze";
      if (tkn_detail.Cad_token[1].amount < data.amount) {
        res.json({ status: false });
        return false;
      }
    } else if (data.type == "freeze") {
      update = "freeze";
      update1 = "unfreeze";
      if (tkn_detail.Cad_token[2].amount < data.amount) {
        res.json({ status: false });
        return false;
      }
    } else if (data.type == "unfreeze") {
      update = "unfreeze";
      update1 = "freeze";
      if (tkn_detail.Cad_token[3].amount < data.amount) {
        res.json({ status: false });
        return false;
      }
    } else {
      res.json({ status: false });
      return false;
    }

    await tokenMining.update(
      { userId: req.genuserId, "Cad_token.type": update },
      { $inc: { "Cad_token.$.amount": -data.amount } }
    );
    await tokenMining.update(
      { userId: req.genuserId, "Cad_token.type": update1 },
      { $inc: { "Cad_token.$.amount": data.amount } }
    );
    res.json({ status: true });
  } catch (e) {
    res.json({ status: false });
    console.log("updateTokenMining", e);
  }
});

router.post("/get_dividend", async function (req, res) {
  console.log("sfasfadfsafasf");
  let pageNo = req.body.pageNo;
  let size = parseInt(req.body.size);
  let query = {};
  console.log(pageNo, size);
  if (pageNo > 0 && size > 0) {
    let skips = size * (pageNo - 1);
    let limits = size;
    let search = req.body.search;
    if (search) {
      query = { userId: { $regex: ".*" + search + ".*", $options: "i" } };
    }
    let totalCount = await dividendPool.find(query).count();
    let dividendData = await dividendPool
      .find(query)
      .skip(skips)
      .limit(limits)
      .sort({ _id: -1 })
      .lean();
    res.json({ status: true, data: dividendData, count: totalCount });
  } else {
    res.json({ status: false, message: "Error fetching data" });
  }
});

// TODO: Refactor this function to use aggregations
router.get("/total_dividendPool", common.whitelistMiddleware, async function (
  req,
  res
) {
  try {
    const poolData = await dividendPool.find().sort({ createddate: -1 }).lean();

    for (let i = 0; i < poolData.length; i++) {
      poolData[i].date = poolData[i].createddate.toLocaleDateString();
    }

    const data = Object.values(
      poolData.reduce(
        (
          result,
          {
            distributed_amount,
            date,
            freezed_tokens,
            createddate,
            currency = "TRX",
          }
        ) => {
          if (!result[date]) {
            result[date] = {
              amounts: {},
            };
          }

          if (!result[date].amounts[currency]) {
            result[date].amounts[currency] = {
              freezed_tokens: 0,
              distributed_amount: 0,
            };
          }

          result[date].createddate = createddate;
          // result[date].freezed_tokens += freezed_tokens;
          result[date].amounts[currency].freezed_tokens += freezed_tokens;
          result[date].amounts[
            currency
          ].distributed_amount += distributed_amount;
          return result;
        },
        {}
      )
    );

    res.json({ status: true, data });
  } catch (e) {
    res.json({ status: false });
    console.log("total_dividendPool", e);
  }
});

router.post("/get_userPool", common.tokenMiddleware, async function (req, res) {
  let sum = 0;
  try {
    let poolData = await dividendPool
      .find({ userId: req.body.userId })
      .sort({ createddate: -1 })
      .lean();
    for (let i = 0; i < poolData.length; i++) {
      sum = sum + poolData[i].distributed_amount;
    }
    res.json({ status: true, data: poolData, total: sum });
  } catch (e) {
    res.json({ status: false });
    console.log("total_dividendPool", e);
  }
});

router.post("/get_userMonth", common.tokenMiddleware, async function (
  req,
  res
) {
  try {
    let data = await dividendPool.aggregate([
      { $match: { userId: req.body.userId } },
      {
        $group: {
          _id: { $month: "$createddate" },
          distributed_amount: { $sum: "$distributed_amount" },
        },
      },
    ]);
    res.json({ status: true, response: data });
  } catch (e) {
    res.json({ status: false });
    console.log("get_userMonth", e);
  }
});

router.post("/get_poolamount", common.tokenMiddleware, async function (
  req,
  res
) {
  try {
    var totalData = await dividendPool.aggregate([
      {
        $match: { userId: req.body.userId, expiry_status: 0, currency: "TRX" },
      },
      { $group: { _id: null, amount: { $sum: "$distributed_amount" } } },
    ]);
    if (totalData[0] && totalData[0].amount) {
      var new_amt = totalData[0].amount;
    } else {
      var new_amt = 0;
    }
    res.json({ status: true, data: new_amt });
  } catch (e) {
    res.json({ status: false });
    console.log("get_poolamount", e);
  }
});

router.post("/get_ethpoolamount", common.tokenMiddleware, async function (
  req,
  res
) {
  try {
    var totalData = await dividendPool.aggregate([
      {
        $match: { userId: req.body.userId, expiry_status: 0, currency: "ETH" },
      },
      { $group: { _id: null, amount: { $sum: "$distributed_amount" } } },
    ]);
    if (totalData[0] && totalData[0].amount) {
      var new_amt = totalData[0].amount;
    } else {
      var new_amt = 0;
    }
    res.json({ status: true, data: new_amt });
  } catch (e) {
    res.json({ status: false });
    console.log("get_ethpoolamount", e);
  }
});

router.post("/get_maticpoolamount", common.tokenMiddleware, async function (
  req,
  res
) {
  try {
    var totalData = await dividendPool.aggregate([
      {
        $match: {
          userId: req.body.userId,
          expiry_status: 0,
          currency: "MATIC",
        },
      },
      { $group: { _id: null, amount: { $sum: "$distributed_amount" } } },
    ]);
    if (totalData[0] && totalData[0].amount) {
      var new_amt = totalData[0].amount;
    } else {
      var new_amt = 0;
    }
    res.json({ status: true, data: new_amt });
  } catch (e) {
    res.json({ status: false });
    console.log("get_maticpoolamount", e);
  }
});

router.post("/updatetkn", common.tokenMiddleware, async function (req, res) {
  try {
    let tokenUpdated = await common.update_token(req);
    res.json(tokenUpdated);
  } catch (e) {
    res.json({ status: false });
    console.log("updatetkn", e);
  }
});

module.exports = router;
