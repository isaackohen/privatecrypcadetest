const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const crypto = require("crypto");
const { Random, uuid4, integer, nodeCrypto, dice } = require("random-js");
const sleep = require("await-sleep");
const multer = require("multer");
const multerS3 = require("multer-s3");
const AWS = require("aws-sdk");

const config = require("../config");
const { dbModel } = require("../model/db");
const TronWeb = require("tronweb");
const redis = require("./redis");
const ticketcount = require("../model/db/ticketcount");
const BalancesService = require("../services/balances");
const PoolService = require("../services/pool");

AWS.config.update({
  accessKeyId: config.AWS_OPTIONS.accessKeyId,
  secretAccessKey: config.AWS_OPTIONS.secretAccessKey,
  region: config.AWS_OPTIONS.region,
});
const s3 = new AWS.S3();

exports.encrypt = (value) => {
  const cipher = crypto.createCipheriv(
    config.crypto.algorithm,
    config.crypto.passPhrase,
    config.crypto.iv
  );
  let encrypted = cipher.update(value, "utf8", "hex");
  encrypted += cipher.final("hex");
  return encrypted;
};

const decrypt = (value) => {
  const decipher = crypto.createDecipheriv(
    config.crypto.algorithm,
    config.crypto.passPhrase,
    config.crypto.iv
  );
  let decrypted = decipher.update(value, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
};
exports.decrypt = decrypt;

exports.createPayload = (key) => {
  let payload = { subject: key };
  let token = jwt.sign(payload, config.crypto.jwtToken);
  return token;
};

const allWinnerdata = async () => {
  let diceData = await dbModel.dice.aggregate([
    { $match: { luckgen: 1, status: 1 } },
    { $sort: { _id: -1 } },
    { $limit: 10 },
    {
      $lookup: {
        from: "Users",
        localField: "userId",
        foreignField: "user_id",
        as: "user_docs",
      },
    },
    { $unwind: "$user_docs" },
    {
      $lookup: {
        from: "Games",
        pipeline: [{ $match: { referenceName: "Dice CrypCade" } }],
        as: "Games",
      },
    },
    { $unwind: "$Games" },
  ]);
  let slotData = await dbModel.slots.aggregate([
    { $match: { trntype: "WIN", amount: { $gt: 0 } } },
    { $sort: { _id: -1 } },
    { $limit: 10 },
    {
      $lookup: {
        from: "UserWallet",
        localField: "userid",
        foreignField: "_id",
        as: "wallet_docs",
      },
    },
    { $unwind: "$wallet_docs" },
    {
      $lookup: {
        from: "Users",
        localField: "wallet_docs.user_id",
        foreignField: "user_id",
        as: "user_docs",
      },
    },
    { $unwind: "$user_docs" },
    {
      $lookup: {
        from: "Games",
        localField: "gameName",
        foreignField: "referenceName",
        as: "Games",
      },
    },
    { $unwind: "$Games" },
  ]);
  let circleData = await dbModel.circle.aggregate([
    { $match: { status: 1 } },
    { $sort: { _id: -1 } },
    { $limit: 10 },
    {
      $lookup: {
        from: "Users",
        localField: "userId",
        foreignField: "user_id",
        as: "user_docs",
      },
    },
    { $unwind: "$user_docs" },
    {
      $lookup: {
        from: "Games",
        pipeline: [{ $match: { referenceName: "Circle" } }],
        as: "Games",
      },
    },
    { $unwind: "$Games" },
  ]);
  // let diceData = await dice.find({ status: 1,luckgen:1}).limit(10).sort({_id:-1}).lean();
  // let slotData = await slots.find({$and:[{trntype:"WIN"}, {$or:[{amount: { $ne: "0.00" }},{amount: { $ne: "0" }}]}]}).populate("userid").limit(20).sort({_id:-1}).lean();
  let concatedata1 = await diceData.concat(slotData);
  let concatedata = await concatedata1.concat(circleData);
  let sorteddata = concatedata.sort(function (a, b) {
    var keyA = new Date(a.createddate),
      keyB = new Date(b.createddate);
    // Compare the 2 dates
    if (keyA > keyB) return -1;
    if (keyA < keyB) return 1;
    return 0;
  });
  let allData = await sorteddata.slice(0, 7);
  let search;
  // for(let i=0;i<allData.length;i++){
  //     if(allData[i].luckyNumber){
  //          search="Dice"
  //     }else{
  //         let value = allData[i].gameName
  //         if(allData[i].providerid && allData[i].providerid == '2'){
  //           let key = value.replace(/_/g , " ");
  //           search=key.replace(' bng','');
  //         }else{
  //           search=value.replace(/ +/g, "");
  //         }
  //     }
  //     let gameQuery = {"$or":[{'reference': { $regex: '.*' + search + '.*',$options: 'i' }},{'description':{ $regex: '.*' + search + '.*',$options: 'i' }}]};
  //     let gData = await dbModel.games.findOne(gameQuery).lean();
  //     if(gData && gData.image){
  //         allData[i].Url = gData.image;
  //     }
  // }
  return allData;
};
exports.allWinnerdata = allWinnerdata;

exports.totalBetAmount = async function (wallets) {
  const diceBet = await dbModel.dice.aggregate([
    { $match: { userId: wallets.user_id } },
    { $group: { _id: "$currency", total: { $sum: "$betAmount" } } },
  ]);
  const circleBet = await dbModel.circle.aggregate([
    { $match: { userId: wallets.user_id } },
    { $group: { _id: "$currency", total: { $sum: "$betAmount" } } },
  ]);
  const shopTransactionsAmount = await dbModel.shopTransactions.aggregate([
    { $match: { userId: wallets.user_id } },
    { $group: { _id: "$currency", total: { $sum: "$price" } } },
  ]);
  const slotBet = await dbModel.slots.aggregate([
    { $match: { userid: wallets._id, trntype: "BET" } },
    {
      $group: {
        _id: "$currency",
        total: { $sum: { $abs: { $toDouble: "$amount" } } },
      },
    },
  ]);

  const reduceCallback = (acc, item) => {
    const key = item._id || "TRX";
    acc[key] = acc[key] || 0;
    acc[key] += item.total;
    return acc;
  };

  const mappedWithDice = diceBet.reduce(reduceCallback, {});
  const mappedWithCircle = circleBet.reduce(reduceCallback, mappedWithDice);
  const mappedWithShopTransactions = shopTransactionsAmount.reduce(
    reduceCallback,
    mappedWithCircle
  );
  return slotBet.reduce(reduceCallback, mappedWithShopTransactions);
};

exports.totalRankBetAmount = async function (wallets) {
  const diceBet = await dbModel.dice.aggregate([
    { $match: { userId: wallets.user_id } },
    { $group: { _id: "$currency", total: { $sum: "$betAmount" } } },
  ]);
  const circleBet = await dbModel.circle.aggregate([
    { $match: { userId: wallets.user_id } },
    { $group: { _id: "$currency", total: { $sum: "$betAmount" } } },
  ]);
  const shopTransactionsAmount = await dbModel.shopTransactions.aggregate([
    { $match: { userId: wallets.user_id } },
    { $group: { _id: "$currency", total: { $sum: "$price" } } },
  ]);
  const slotBet = await dbModel.slots.aggregate([
    { $match: { userid: wallets._id, trntype: "BET" } },
    { $group: { _id: "$currency", total: { $sum: { $abs: "$amount" } } } },
  ]);

  const reduceCallback = (acc, item) => {
    const key = item._id || "TRX";
    acc[key] = acc[key] || 0;
    acc[key] += item.total;
    return acc;
  };

  const mappedWithDice = diceBet.reduce(reduceCallback, {});
  const mappedWithCircle = circleBet.reduce(reduceCallback, mappedWithDice);
  const mappedWithShopTransactions = shopTransactionsAmount.reduce(
    reduceCallback,
    mappedWithCircle
  );
  const mappedSlots = slotBet.reduce(
    reduceCallback,
    mappedWithShopTransactions
  );
  return mappedSlots;
};

exports.Wagerslotdata = async function (type) {
  let array_game = [];
  let settingData = await dbModel.dividendSettings.findOne().lean();
  if (settingData.wager_pool_amount && settingData.winner_pool_amount) {
    var today = new Date();
    var tdy_day = today.getUTCDay();
    let daysToCal;
    switch (tdy_day) {
      case 5:
        daysToCal = 1;
        break;
      case 6:
        daysToCal = 2;
        break;
      case 0:
        daysToCal = 3;
        break;
      case 1:
        daysToCal = 4;
        break;
      case 2:
        daysToCal = 5;
        break;
      case 3:
        daysToCal = 6;
        break;
      case 4:
        daysToCal = 7;
        break;
    }
    if (type === "cron") {
      daysToCal = 7;
    }
    let games_data = await dbModel.games.find({ game: "Table Games" });
    if (games_data.length > 0) {
      games_data.map(function (item) {
        array_game.push(item.referenceName);
      });
    }
    var queryDate = new Date(Date.now() - 24 * 60 * 60 * 1000 * daysToCal);
    var date = queryDate.getDate();
    queryDate.setDate(date);
    queryDate.setHours(+"00");
    queryDate.setMinutes(+"00");
    queryDate.setSeconds(+"00");
    let wagerData = await dbModel.slots.aggregate([
      {
        $match: {
          trntype: "BET",
          currency: "TRX",
          gameName: { $nin: array_game },
          createddate: { $gt: new Date(queryDate) },
        },
      },
      {
        $group: {
          _id: "$userid",
          betAmount: { $sum: { $abs: { $toDouble: "$amount" } } },
        },
      },
      { $sort: { betAmount: -1 } },
      { $limit: 20 },
      {
        $lookup: {
          from: "UserWallet",
          localField: "_id",
          foreignField: "_id",
          as: "wallet_docs",
        },
      },
      { $unwind: "$wallet_docs" },
      {
        $lookup: {
          from: "Users",
          localField: "wallet_docs.user_id",
          foreignField: "user_id",
          as: "user_docs",
        },
      },
      { $unwind: "$user_docs" },
    ]);
    let winnerData = await dbModel.slots.aggregate([
      {
        $match: {
          trntype: "WIN",
          currency: "TRX",
          gameName: { $nin: array_game },
          $or: [{ amount: { $ne: "0.00" } }, { amount: { $ne: "0" } }],
          createddate: { $gt: new Date(queryDate) },
        },
      },
      {
        $group: {
          _id: "$userid",
          betAmount: { $sum: { $abs: { $toDouble: "$amount" } } },
        },
      },
      { $sort: { betAmount: -1 } },
      { $limit: 20 },
      {
        $lookup: {
          from: "UserWallet",
          localField: "_id",
          foreignField: "_id",
          as: "wallet_docs",
        },
      },
      { $unwind: "$wallet_docs" },
      {
        $lookup: {
          from: "Users",
          localField: "wallet_docs.user_id",
          foreignField: "user_id",
          as: "user_docs",
        },
      },
      { $unwind: "$user_docs" },
    ]);

    for (let i = 0; i < wagerData.length; i++) {
      if (i === 0) {
        wagerData[i]["prize"] = 0.5 * settingData.wager_pool_amount;
      } else {
        wagerData[i]["prize"] = 0.5 * wagerData[i - 1]["prize"];
      }
    }
    for (let i = 0; i < winnerData.length; i++) {
      if (i === 0) {
        winnerData[i]["prize"] = 0.5 * settingData.winner_pool_amount;
      } else {
        winnerData[i]["prize"] = 0.5 * winnerData[i - 1]["prize"];
      }
    }
    let data = { wagerData, winnerData };
    return data;
  } else {
    let wagerData = [];
    let winnerData = [];
    let data = { wagerData, winnerData };
    return data;
  }
};

var checkedOnce = 0;
let logsWrite = (exports.logsWrite = (key) => {
  if (checkedOnce === 0) {
    checkedOnce = 1;
    fs.readFile("./logs/combined1.outerr.log", "utf-8", (err, data) => {
      if (!err && data !== "") {
        var logs = data;
      } else {
        var logs = "";
      }
      if (typeof key != "object" && typeof key !== "array") {
        logs = logs + " " + key + "\n";
      } else {
        logs = logs + " , " + JSON.stringify(key) + "\n";
      }
      fs.writeFile("./logs/combined1.outerr.log", logs, (err) => {
        checkedOnce = 0;
      });
    });
  } else {
    setTimeout(function () {
      logsWrite(key);
    }, 3000);
  }
});

const whitelist = [
  "https://crypstagcade.crypcade.io",
  "https://crypadsqcryp.crypcade.io",
  "https://checkcrypcade.crypcade.io",
  "https://crypcade.io",
  "https://crypadsqcryp.crypcade.io",
  "http://localhost:4200",
  "http://localhost:4500",
  "http://localhost:4600",
  "http://localhost:8080",
  "http://192.168.2.180:4600",
  "http://192.168.2.180:4500",
  "http://192.168.4.151:4500",
  "http://192.168.4.75:4200",
  "https://crypstagcade.crypcade.io",
  "https://crypadmincads.crypcade.io",
  "http://192.168.4.7:4500",
  "http://192.168.4.7:4600",
  "http://127.0.0.1:8880",
];

exports.whitelistMiddleware = (req, res, next) => {
  const origin = req.headers["origin"];
  if (!whitelist.includes(origin))
    return res.json({ status: false, code: 401, msg: "unauthorized" });
  next();
};

exports.tokenMiddleware = (req, res, next) => {
  try {
    const origin = req.headers["origin"];
    const token = req.headers.authorization
      ? req.headers.authorization.split(" ")[1]
      : "";

    if (!req.headers.authorization || !token || !whitelist.includes(origin))
      return res.json({ status: false, code: 401, msg: "unauthorized" });

    const payload = jwt.verify(token, config.crypto.jwtToken);
    if (!payload) return res.status(401).send("unauthorized");

    req.genuserId = payload.subject;
    next();
  } catch (error) {
    console.log(`JWT error: ${req.headers}`, error);
    return res.status(401).send("unauthorized");
  }
};

exports.bgTokenMiddleware = (req, res, next) => {
  const token = req.headers.authorization.split(" ")[1];
  if (!token)
    return res.json({ status: false, code: 401, msg: "unauthorized" });

  const payload = jwt.verify(token, config.crypto.jwtToken);
  if (!payload) return res.status(401).send("unauthorized");

  req.genuserId = payload.subject;
  next();
};

exports.update_profit = async function (walletAddress) {
  let userData = await dbModel.tokenMining.find();
  var tokenMiningData = await dbModel.tokenMining.findOne({
    userId: walletAddress,
  });
  let settings = await dbModel.dividendSettings.findOne().lean();
  var total_tokn = 0;
  var day_amt = 0;
  var month_amt = 0;
  var day_amt_eth = 0;
  var month_amt_eth = 0;
  if (
    settings.fake_pool_amount > 0 ||
    settings.eth_fake_pool_amount > 0 ||
    settings.matic_fake_pool_amount > 0
  ) {
    if (userData) {
      for (let i = 0; i < userData.length; i++) {
        if (
          userData[i].Cad_token[3].type === "unfreeze" &&
          userData[i].Cad_token[3].amount
        ) {
          var total_tokn =
            parseFloat(total_tokn) + userData[i].Cad_token[3].amount;
        }
      }
      if (settings.user_percent > 0 && tokenMiningData) {
        if (
          tokenMiningData.Cad_token[3].type === "unfreeze" &&
          tokenMiningData.Cad_token[3].amount
        ) {
          var amt =
            parseFloat(tokenMiningData.Cad_token[3].amount) /
            parseFloat(total_tokn);
          if (settings.fake_pool_amount > 0) {
            var day_amt =
              parseFloat(amt) *
              parseFloat(settings.user_percent / 100) *
              parseFloat(settings.fake_pool_amount);
            var month_amt = parseFloat(day_amt) * 30;
          }

          if (settings.eth_fake_pool_amount > 0) {
            var day_amt_eth =
              parseFloat(amt) *
              parseFloat(settings.user_percent / 100) *
              parseFloat(settings.eth_fake_pool_amount);
            var month_amt_eth = parseFloat(day_amt_eth) * 30;
          }

          if (settings.matic_fake_pool_amount > 0) {
            var day_amt_matic =
              parseFloat(amt) *
              parseFloat(settings.user_percent / 100) *
              parseFloat(settings.matic_fake_pool_amount);
            var month_amt_matic = parseFloat(day_amt_matic) * 30;
          }

          return {
            status: true,
            data: {
              day_data_trx: day_amt,
              month_data_trx: month_amt,
              day_data_eth: day_amt_eth,
              month_data_eth: month_amt_eth,
              day_data_matic: day_amt_matic,
              month_data_matic: month_amt_matic,
            },
          };
        } else {
          return {
            status: true,
            data: {
              day_data_trx: 0,
              month_data_trx: 0,
              day_data_eth: 0,
              month_data_eth: 0,
              day_data_matic: 0,
              month_data_matic: 0,
            },
          };
        }
      } else {
        return {
          status: true,
          data: {
            day_data_trx: 0,
            month_data_trx: 0,
            day_data_eth: 0,
            month_data_eth: 0,
            day_data_matic: 0,
            month_data_matic: 0,
          },
        };
      }
    } else {
      return {
        status: true,
        data: {
          day_data_trx: 0,
          month_data_trx: 0,
          day_data_eth: 0,
          month_data_eth: 0,
          day_data_matic: 0,
          month_data_matic: 0,
        },
      };
    }
  } else {
    return {
      status: true,
      data: {
        day_data_trx: 0,
        month_data_trx: 0,
        day_data_eth: 0,
        month_data_eth: 0,
        day_data_matic: 0,
        month_data_matic: 0,
      },
    };
  }
};

exports.update_beantoken = async function (req) {
  let tronLink = await tronBeanLink();
  var siteDetails = await dbModel.siteSettings.findOne({}).lean();
  let instance = await tronLink.contract().at(config.trx.beancontract);
  var available_token = await instance.balanceOf(req.genuserId).call();
  var freezed_token = await instance.freezeOf(req.genuserId).call();
  var balance = Number(available_token._hex) / 1000000;
  var freezed = Number(freezed_token._hex) / 1000000;
  var update_balance = parseInt(balance);
  var update_freeze = parseInt(freezed);
  var tkn_detail = await dbModel.bean.findOne({ userId: req.genuserId }).lean();
  if (tkn_detail) {
    var updatetoken = await dbModel.bean.updateOne(
      { userId: req.genuserId },
      { $set: { freeze: update_freeze, available: update_balance } }
    );
    let beanData = await dbModel.bean.findOne({
      userId: req.genuserId,
    });
    io.emit("getbeantknusr", {
      tokenData: beanData,
      address: req.genuserId,
    });
    return { status: true };
  } else {
    await dbModel.bean.create({
      userId: req.genuserId,
      freeze: update_freeze,
      available: update_balance,
    });
    let beanData = await dbModel.bean.findOne({
      userId: req.genuserId,
    });
    io.emit("getbeantknusr", {
      tokenData: beanData,
      address: req.genuserId,
    });
    return { status: true };
  }
};

exports.update_beantokenaction = async function (req) {
  console.log("updatebenatoken");
  let tronLink = await tronBeanLink();
  var siteDetails = await dbModel.siteSettings.findOne({}).lean();
  let instance = await tronLink.contract().at(config.trx.beancontract);
  var available_token = await instance.balanceOf(req.genuserId).call();
  var freezed_token = await instance.freezeOf(req.genuserId).call();
  var balance = Number(available_token._hex) / 1000000;
  var freezed = Number(freezed_token._hex) / 1000000;
  var update_balance = parseInt(balance);
  var update_freeze = parseInt(freezed);
  var tkn_detail = await dbModel.bean.findOne({ userId: req.genuserId }).lean();
  if (tkn_detail) {
    console.log("Dfdfdfdf");
    var updatetoken = await dbModel.bean.updateOne(
      { userId: req.genuserId },
      {
        $set: {
          freeze: update_freeze,
          available: update_balance,
          updatedDate: Date.now(),
        },
      }
    );
    let beanData = await dbModel.bean.findOne({
      userId: req.genuserId,
    });
    io.emit("getbeantknusr", {
      tokenData: beanData,
      address: req.genuserId,
    });
    return { status: true };
  } else {
    return { status: true };
  }
};

exports.update_token = async function (req) {
  let tronLink = await tronWebLink();
  var siteDetails = await dbModel.siteSettings.findOne({}).lean();
  let instance = await tronLink.contract().at(siteDetails.contractAddress);
  var tkn_detail = await dbModel.tokenMining
    .findOne({ userId: req.genuserId })
    .lean();
  if (tkn_detail) {
    var mined_token = await instance.balances(req.genuserId).call();
    var freezed_token = await instance.freezeOf(req.genuserId).call();
    var mined = Number(mined_token._hex) / 1000000000000000000;
    var freezed = Number(freezed_token._hex) / 1000000000000000000;
    var update_mine = parseInt(mined);
    var update_freeze = parseInt(freezed);
    var updateMine = await dbModel.tokenMining.updateOne(
      { userId: req.genuserId, "Cad_token.type": "mined" },
      { $set: { "Cad_token.$.amount": update_mine } }
    );
    var updateFreeze = await dbModel.tokenMining.updateOne(
      { userId: req.genuserId, "Cad_token.type": "unfreeze" },
      { $set: { "Cad_token.$.amount": update_freeze } }
    );
    if (updateMine || updateFreeze) {
      let tokenMiningData = await dbModel.tokenMining.findOne({
        userId: req.genuserId,
      });
      io.emit("gettknusr", {
        tokenData: tokenMiningData,
        address: req.genuserId,
      });
      return { status: true };
    } else {
      return { status: true };
    }
  } else {
    return { status: false };
  }
};

// todo - to delete this function
exports.SetredisConfig = function (key, type, callback) {
  var types = [];
  if (type !== "") {
    var types = type.split(",");
  }
  if (typeof types[0] === undefined || typeof types[0] == "undefined") {
    types[0] = "";
  }
  if (typeof types[1] === undefined || typeof types[1] == "undefined") {
    types[1] = "";
  }
  if (types.length === 2) {
    var column = types[0];
    var value = types[1];
    let redisModel = mongoose.model(key);
    var getFrom = [];
    redisModel.find().exec((userErr, userRes) => {
      if (userRes) {
        for (i = 0; i < userRes.length; i++) {
          if (column !== "") {
            if (isNaN(userRes[i][column])) {
              var keys = userRes[i][column];
            } else {
              var keys = i;
            }
          } else {
            var keys = i;
          }
          getFrom[keys] = userRes[i];
        }
        var response = JSON.stringify(getFrom);
        client.set(key, response);
        if (value !== "" && isNa(Nvalue)) {
          callback(getFrom[value]);
        } else {
          callback(res(getFrom, column, value));
        }
      } else {
        callback(false);
      }
    });
  } else {
    callback(false);
  }
};

// todo - to delete this function
const res = (exports.sendRes = function (datas, column, value) {
  if (column !== "" && value !== "") {
    var push = [];
    var inC = 0;
    for (i = 0; i < datas.length; i++) {
      if (datas[i][column] === value) {
        push[inC] = datas[i];
        inC++;
      }
    }
  } else {
    var push = datas;
  }
  return push;
});

// exports.insertActivity = (userId, comment, type, role, req) => {
//     const ua = req.headers['user-agent'];
//     var browser= '';
//     if( /firefox/i.test(ua) )
//       browser = 'firefox';
//     else if( /chrome/i.test(ua) )
//       browser = 'chrome';
//     else if( /safari/i.test(ua) )
//       browser = 'safari';
//     else if( /msie/i.test(ua) )
//       browser = 'msie';
//     else
//       browser = 'unknown';
//
//     var ipaddr = req.header('x-forwarded-for') || req.connection.remoteAddress;
//     var ip = ipaddr.replace('::ffff:', '');
//
//     let activityDB = mongoose.model('AdminActivity');
//     let useractivityDB = mongoose.model('Useractivity');
//         var ip = ip;
//         var location = '';
//         var browser = browser;
//         let activityJson = {
//             user_id: userId,
//             ip: ip,
//             location: location,
//             browser: browser,
//             type: type,
//             comment: comment,
//
//
//         }
//         if(role === 'admin')
//         {
//         activityDB.create(activityJson, function (err, resData) {
//         });
//         }
//         else{
//           useractivityDB.create(activityJson, function (err, resData) {
//         });
//         }
// }

exports.placeToken_nw = async (data) => {
  const userExists = await dbModel.betCount.findOne({
    userId: data.userId,
    game_type: data.game_type,
  });
  const settings = await dbModel.dividendSettings.findOne();
  const trxCount =
    data.game_type === 1 ? settings.inhouse_cade : settings.slot_cade;

  if (userExists) {
    const currentBetAmount = userExists.betAmount + parseFloat(data.betAmount);
    await betCountUpdated_nw(currentBetAmount, trxCount, userExists, "update");
  } else {
    await betCountUpdated_nw(
      parseFloat(data.betAmount),
      trxCount,
      data,
      "create"
    );
  }
};

exports.placeToken = async (data) => {
  const currency = data.currency || "TRX";

  const userBetCount = await dbModel.betCount.findOne({
    userId: data.userId,
    game_type: data.game_type,
    currency,
  });
  const settings = await dbModel.dividendSettings.findOne();

  const keySuffixByCurrency = {
    TRX: "cade",
    ETH: "cade_eth",
    MATIC: "cade_matic",
  };

  const keyPrefix = data.game_type === 1 ? "inhouse" : "slot";
  const keySuffix = keySuffixByCurrency[currency];
  const trxCount = settings[`${keyPrefix}_${keySuffix}`];
  // console.log({trxCount})

  const multiplierValue = await getUsrActiveMultiplierValue(
    data.userId,
    settings.user_multiplier_mining_limit
  );

  if (userBetCount) {
    const currentBetAmount = +userBetCount.betAmount + +data.betAmount;
    // console.log({currentBetAmount, trxCount, 'userExists.betAmount': userBetCount.betAmount, 'data.betAmount': data.betAmount})
    if (currentBetAmount >= trxCount) {
      const tokenCount = (currentBetAmount / trxCount) * multiplierValue;
      // const tokenCountWithoutMultiplier = parseInt(currentBetAmount / trxCount);
      // console.log({tokenCountWithoutMultiplier, tokenCount, multiplierValue})
      await tokenInsertion(userBetCount, tokenCount);
      await placeTokenReferral(
        tokenCount,
        data.game_type,
        data.userId,
        data.currency
      );
      if (multiplierValue > 1)
        await updateUserMultiplierMinedTokens(
          data.userId,
          tokenCount,
          settings.user_multiplier_mining_limit
        );
    }
    await betCountUpdated(currentBetAmount, trxCount, userBetCount, "update");
  } else {
    // console.log({trxCount, 'userExists.betAmount': userBetCount.betAmount, 'data.betAmount': data.betAmount})
    if (+data.betAmount >= trxCount) {
      const tokenCount = (data.betAmount / trxCount) * multiplierValue;
      // let tokenCountWithoutMultiplier = parseInt(data.betAmount / trxCount * multiplierValue);
      // console.log({tokenCountWithoutMultiplier, tokenCount, multiplierValue})
      await tokenInsertion(data, tokenCount);
      await placeTokenReferral(
        tokenCount,
        data.game_type,
        data.userId,
        data.currency
      );
      if (multiplierValue > 1)
        await updateUserMultiplierMinedTokens(
          data.userId,
          tokenCount,
          settings.user_multiplier_mining_limit
        );
    }
    await betCountUpdated(parseFloat(data.betAmount), trxCount, data, "create");
  }
};

const updateUserMultiplierMinedTokens = async (
  userId,
  tokenCount,
  miningLimit = 0
) => {
  const user = await dbModel.users.findOneAndUpdate(
    {
      user_id: userId,
      "multipliers.active": true,
    },
    {
      $inc: {
        "multipliers.$.minedTokens": tokenCount,
      },
    }
  );

  if (!user || !Array.isArray(user.multipliers)) return;

  const activeMultiplier = user.multipliers.find(
    (multiplier) => multiplier.active
  );
  const exceededTheMiningLimit =
    activeMultiplier &&
    activeMultiplier.minedTokens + tokenCount >= miningLimit;

  if (miningLimit && exceededTheMiningLimit) {
    await user.findOneAndUpdate(
      {
        user_id: userId,
        "multipliers.active": true,
      },
      {
        $set: {
          "multipliers.$.active": false,
        },
      }
    );
  }
};

const getUsrActiveMultiplierValue = async (userId, miningLimit = 0) => {
  const user = await dbModel.users.findOne({
    user_id: userId,
    "multipliers.active": true,
  });

  if (!user || !Array.isArray(user.multipliers)) return 1;

  const activeMultiplier = user.multipliers.find(
    (multiplier) => multiplier.active
  );

  if (!activeMultiplier) return 1;

  const isValidByMinedTokens =
    !miningLimit || activeMultiplier.minedTokens < miningLimit;
  const isValidByDate = getIsValidMultiplierByDate(activeMultiplier);

  if (!isValidByMinedTokens || !isValidByDate) return 1;

  return activeMultiplier.value || 1;
};

const getIsValidMultiplierByDate = (userMultiplier) => {
  if (!userMultiplier || !userMultiplier.appliedOn) return false;

  const now = new Date();
  const yesterday = new Date(now.setDate(now.getDate() - 1));
  const appliedOn = new Date(userMultiplier.appliedOn);

  return appliedOn > yesterday;
};

const placeTokenReferral = async (tokenCount, gameType, userId, currency) => {
  const userRef = await dbModel.users.findOne({ user_id: userId }).lean();
  if (!userRef || !userRef.invitedBy) return;

  const userDetails = await dbModel.users
    .findOne({ _id: userRef.invitedBy })
    .lean();
  const siteSettings = await dbModel.siteSettings.findOne();
  const betAmount = (siteSettings.referal_cade / 100) * tokenCount;
  const userExists = await dbModel.betCount_ref.findOne({
    userId: userDetails.user_id,
    game_type: gameType,
    currency: currency,
  });

  const crtData = {
    userId: userDetails.user_id,
    betAmount: betAmount,
    game_type: gameType,
    currency: currency,
  };

  if (userExists) {
    let currentBetAmount = userExists.betAmount + parseFloat(betAmount);
    let tokenCount = parseInt(currentBetAmount);
    const tokenData = {
      userId: userDetails.user_id,
      ruserId: userId,
      token_count: tokenCount,
    };
    if (tokenCount >= 1) {
      await tokenInsertion(userExists, tokenCount);
      await dbModel.gaugeCade.create(tokenData);
    }
    await betCountUpdated_ref(currentBetAmount, tokenCount, crtData, "update");
  } else {
    const tokenCount = parseInt(betAmount);
    const tokenData = {
      userId: userDetails.user_id,
      ruserId: userId,
      token_count: tokenCount,
    };
    if (tokenCount >= 1) {
      await tokenInsertion(crtData, tokenCount);
      await dbModel.gaugeCade.create(tokenData);
    }
    await betCountUpdated_ref(
      parseFloat(betAmount),
      tokenCount,
      crtData,
      "create"
    );
  }
};

const betCountUpdated_ref = async (currentBetAmount, trxCount, data, type) => {
  data.betAmount =
    currentBetAmount >= trxCount
      ? currentBetAmount - trxCount
      : currentBetAmount;
  if (type === "create") {
    await dbModel.betCount_ref.create(data);
  } else {
    await dbModel.betCount_ref.update(
      {
        userId: data.userId,
        game_type: data.game_type,
        currency: data.currency,
      },
      { $set: { betAmount: data.betAmount } }
    );
  }
};

const betCountUpdated = async (currentBetAmount, trxCount, data, type) => {
  const token_transfer = currentBetAmount / +trxCount;
  const balance_total = +currentBetAmount - token_transfer * trxCount;
  const betAmount = balance_total.toFixed(2);

  if (type === "create") {
    if (currentBetAmount >= trxCount) {
      await dbModel.betCount.create({
        userId: data.userId,
        game_type: data.game_type,
        betAmount: data.betAmount,
        currency: data.currency,
      });
    } else {
      await dbModel.betCount.create({
        userId: data.userId,
        game_type: data.game_type,
        betAmount: data.betAmount,
        currency: data.currency,
      });
    }
  } else {
    if (currentBetAmount >= trxCount) {
      await dbModel.betCount.update(
        {
          userId: data.userId,
          game_type: data.game_type,
          currency: data.currency,
        },
        { $set: { betAmount: balance_total } }
      );
    } else {
      await dbModel.betCount.update(
        {
          userId: data.userId,
          game_type: data.game_type,
          currency: data.currency,
        },
        { $set: { betAmount: currentBetAmount } }
      );
    }
  }
};

exports.ticketSystem = async (data) => {
  const userticketcount = await dbModel.ticketcount.findOne({
    userId: data.userId,
    currency: data.currency,
  });
  const ticketsetting = await dbModel.ticketsystem
    .findOne({ currency: data.currency, status: 1 })
    .lean();
  if (ticketsetting) {
    var today = new Date();
    var start_date = new Date(ticketsetting.startdate);
    var end_date = new Date(ticketsetting.enddate);
    if (start_date <= today && end_date >= today) {
      var betcount = ticketsetting.betcount;
      if (userticketcount) {
        const currentBetAmount = +userticketcount.betAmount + +data.betAmount;
        if (currentBetAmount >= betcount) {
          const ticketCount = currentBetAmount / betcount;
          var updateticket =
            currentBetAmount - betcount * parseInt(ticketCount);
          await ticketInsertion(userticketcount, parseInt(ticketCount));
          await ticketCountUpdated(updateticket, data, "update");
        } else {
          var updateticket = currentBetAmount;
          await ticketCountUpdated(updateticket, data, "update");
        }
      } else {
        if (+data.betAmount >= betcount) {
          const ticketCount = data.betAmount / betcount;
          var updateticket = data.betAmount - betcount * parseInt(ticketCount);
          await ticketInsertion(data, parseInt(ticketCount));
          await ticketCountUpdated(updateticket, data, "create");
        } else {
          var updateticket = data.betAmount;
          await ticketCountUpdated(updateticket, data, "create");
        }
      }
    }
  }
};

exports.dicewinmultipler = async (user_id) => {
  const promosetting = await dbModel.promosystem
    .findOne({ promotitle: "DiceWinsMultiplierRace", status: 1 })
    .lean();
  if (promosetting) {
    var today = new Date();
    var start_date = new Date(promosetting.startdate);
    var end_date = new Date(promosetting.enddate);
    let multiplier = 0;
    if (start_date <= today && end_date >= today) {
      var dice_data = await dbModel.dice
        .findOne({ userId: user_id, status:1}).sort({_id:-1}).limit(1)
        .lean();
      if (dice_data) {
         multiplier = dice_data.multiplier;
         if (multiplier > 0) {
            let alrdy_availble = await dbModel.dicewinmultiplier
              .findOne({ userId: user_id })
              .lean();
            console.log("availa", alrdy_availble);
            if (alrdy_availble) {
              let total_multiplier = parseFloat(alrdy_availble.multiplier)+parseFloat(multiplier);
              await dbModel.dicewinmultiplier.update(
                {
                  userId: user_id,
                },
                {
                  $set: {
                    multiplier: total_multiplier,
                  },
                }
              );
            } else {
              console.log("dfdfdfd");
              let ins_data = {
                userId: user_id,
                multiplier: multiplier
              };

              await dbModel.dicewinmultiplier.create(ins_data);
            }
          }
        
      }
    }
  }
};

exports.slotwinmultipler = async (round_id) => {
  const promosetting = await dbModel.promosystem
    .findOne({ promotitle: "SlotsWinsMultiplierRace", status: 1 })
    .lean();
  if (promosetting) {
    var today = new Date();
    var start_date = new Date(promosetting.startdate);
    var end_date = new Date(promosetting.enddate);
    let slotWinAmount = 0;
    let slotBetAmount = 0;
    if (start_date <= today && end_date >= today) {
      var bet_data = await dbModel.slots
        .findOne({ roundid: round_id, trntype: "BET" })
        .lean();
      var win_data = await dbModel.slots
        .find({ roundid: round_id, trntype: "WIN" })
        .lean();
      if (bet_data && win_data) {
        slotBetAmount = Math.abs(bet_data.amount);
        for (let i = 0; i < win_data.length; i++) {
          slotWinAmount += +win_data[i].amount;
        }
        if (slotWinAmount > 0 && slotWinAmount > slotBetAmount) {
          let multiplier =
            slotBetAmount > 0 ? slotWinAmount / slotBetAmount : slotWinAmount;
          if (multiplier > 0) {
            let alrdy_availble = await dbModel.slotwinmultiplier
              .findOne({ roundid: round_id })
              .lean();
            if (alrdy_availble) {
              let trx_addr = await dbModel.wallet
                .findOne({ _id: bet_data.userid })
                .lean();
              await dbModel.slotwinmultiplier.update(
                {
                  userId: trx_addr.user_id,
                  roundid: round_id,
                  providerid: bet_data.providerid,
                },
                {
                  $set: {
                    winAmount: slotWinAmount,
                    multiplier: multiplier.toFixed(2),
                  },
                }
              );
            } else {
              let trx_addr = await dbModel.wallet
                .findOne({ _id: bet_data.userid })
                .lean();
              let ins_data = {
                userId: trx_addr.user_id,
                betAmount: slotBetAmount,
                winAmount: slotWinAmount,
                multiplier: multiplier.toFixed(2),
                providerid: bet_data.providerid,
                roundid: round_id,
              };

              await dbModel.slotwinmultiplier.create(ins_data);
            }
          }
        }
      }
    }
  }
};

const ticketCountUpdated = async (ticketCount, data, type) => {
  if (type === "create") {
    await dbModel.ticketcount.create({
      userId: data.userId,
      betAmount: ticketCount,
      currency: data.currency,
    });
  } else {
    await dbModel.ticketcount.update(
      { userId: data.userId, currency: data.currency },
      { $set: { betAmount: ticketCount } }
    );
  }
};

const betCountUpdated_nw = async (currentBetAmount, trxCount, data, type) => {
  if (type === "create") {
    data.betAmount = currentBetAmount;
    await dbModel.betCount.create(data);
  } else {
    await dbModel.betCount.update(
      { userId: data.userId },
      { $set: { betAmount: currentBetAmount } }
    );
  }
};

const tokenInsertion = async (userData, tokenCount) => {
  const userExists = await dbModel.tokenMining.findOne({
    userId: userData.userId,
  });
  if (userExists) {
    await dbModel.tokenMining.update(
      { userId: userExists.userId, "Cad_token.type": "claim" },
      { $inc: { "Cad_token.$.amount": tokenCount } }
    );
  } else {
    const data = {
      userId: userData.userId,
      Cad_token: [
        {
          type: "claim",
          amount: tokenCount,
        },
        {
          type: "mined",
          amount: 0,
        },
        {
          type: "freeze",
          amount: 0,
        },
        {
          type: "unfreeze",
          amount: 0,
        },
      ],
    };
    await dbModel.tokenMining.create(data);
  }
};

exports.tokenInsertion = tokenInsertion;

const ticketInsertion = async (userData, ticketCount) => {
  const userExists = await dbModel.ticket.findOne({ userId: userData.userId });
  if (userExists) {
    await dbModel.ticket.update(
      { userId: userExists.userId },
      { $inc: { tickets: ticketCount } }
    );
  } else {
    const data = {
      userId: userData.userId,
      tickets: ticketCount,
    };
    await dbModel.ticket.create(data);
  }
};

exports.ticketInsertion = ticketInsertion;

exports.rankIdentify = (data) => {
  const cashBackPercentage = [0, 1, 1, 3, 5, 7, 10, 12, 15, 22, 30];
  return cashBackPercentage[data.rank];
};

exports.eurconverter = async (currency) => {
  const divisett = await dbModel.dividendSettings.findOne().lean();
  let currentvalue = 0;
  switch (currency) {
    case "TRX":
      currentvalue = divisett.trx_eur;
      break;
    case "ETH":
      currentvalue = divisett.eth_eur;
      break;
    case "MATIC":
      currentvalue = divisett.matic_eur;
      break;
  }
  return currentvalue;
};

exports.providerId = (provider) => {
  const providerlist = {
    platipus: "1",
    booongo: "2",
    endorphina: "3",
    Yggdrasil: "4",
    Dlv: "5",
    Ezugi: "6",
    Thunderkick: "7",
    Lucky: "8",
    ReelNRG: "9",
    Tomhorn: "10",
    RevolverGaming: "11",
    BGaming: "12",
    "CT Gaming": "13",
    Betsoft: "14",
    NetGame: "15",
    Quickspin: "16",
    Blueprint: "17",
    TripleCherry: "18",
    Amatic: "19",
    Belatra: "20",
    Betgames: "21",
    Betsolutions: "22",
    "Casino Technology": "23",
    Charismatic: "24",
    "Evolution Gaming": "25",
    Evoplay: "26",
    "Green Jade": "27",
    Igrosoft: "28",
    KAGaming: "29",
    "Lotto Instant Win": "30",
    OneTouch: "31",
    "RTG SLOTS": "32",
    Spadegaming: "33",
    "Super Spade Gaming": "34",
    Vivogaming: "35",
    XProgaming: "36",
    CasinoTechnology: "37",
    "Belatra Games": "38",
    Gamshy: "39",
    Caleta: "40",
  };
  return providerlist[provider];
};

exports.providerrestiction = (provider) => {
  const providerlist = {
    Yggdrasil:
      "AF,AS,AO,AU,BE,BA,KH,HR,CZ,CD,DE,ET,HU,IR,IQ,IT,LA,LV,LT,RO,SG,SY,UG,USA,UK,VU,YE,DE,IL,CU,BG,ES,SE,PT,CO,EE,HK,PH",
    Dlv:
      "AU,BE,KY,CW,FR,HK,IR,IQ,IE,IL,IT,JP,MM,NL,KP,PL,SA,SG,SY,TR,USA,UK,VA,LV",
    Ezugi:
      "AF,AS,AO,AU,BE,BA,KH,HR,CZ,DK,ET,HU,IQ,IT,LA,LV,LT,RO,SG,SY,UG,USA,UK,VU,YE,NL,ZA,CR,ES,CO,IL,FR,IR,KR",
    Thunderkick:
      "AF,AS,AO,AU,BE,BA,KH,HR,CZ,CD,DE,ET,HU,IR,IQ,IT,LA,LV,LT,RO,SG,SY,UG,USA,UK,VU,YE,DE,IL,CU,BG,ES,SE,PT,CO,EE,HK,PH",
    Lucky: "",
    ReelNRG: "FR,CW,USA,NL,UK",
    Tomhorn: "IL,IT,CH,USA,UK",
    RevolverGaming:
      "AF,AS,AO,AU,BE,BA,KH,HR,CZ,CD,DE,ET,HU,IR,IQ,IT,LA,LV,LT,RO,SG,SY,UG,USA,UK,VU,YE,DE,IL,CU,BG,ES,SE,PT,CO,EE,HK,PH",
    BGaming: "",
    "CT Gaming": "USA,CA",
    Betsoft: "",
    NetGame: "FR,USA,NL,CW,UK,AW,BQ,MQ,UA",
    Quickspin:
      "AF,AS,AO,AU,BE,BA,KH,HR,CZ,CD,DE,ET,HU,IR,IQ,IT,LA,LV,LT,RO,SG,SY,UG,USA,UK,VU,YE,DE,IL,CU,BG,ES,SE,PT,CO,EE,HK,PH",
    Blueprint:
      "CA,AF,AS,AO,AU,BE,BA,KH,HR,CZ,CD,DE,ET,HU,IR,IQ,IT,LA,LV,LT,RO,SG,SY,UG,USA,UK,VU,YE,DE,IL,CU,BG,ES,SE,PT,CO,EE,HK,PH",
    TripleCherry: "",
    Amatic:
      "AF,AL,DZ,AO,AG,AM,AU,AT,BA,CN,KH,CU,CY,EC,EE,FR,PF,GE,GY,HK,ID,IR,IQ,IL,KW,LA,LY,LI,MO,NA,AN,NI,KP,PK,PA,PG,PE,PH,SG,SK,ZA,KR,SD,CH,SY,TW,TN,UG,USA,VI,YE,ZW,UK",
    Belatra: "BY",
    Betgames: "USA,UK",
    Betsolutions: "USA",
    "Casino Technology": "USA,CA",
    Charismatic: "USA",
    "Evolution Gaming": "MM,CN,CU,CY,IR,IL,LV,TR,SD,SY,USA,UK,AU,CO,KP",
    Evoplay:
      "AF,AU,CU,CW,ER,ET,FR,IR,IQ,IL,JO,LY,KP,PK,PH,RW,SG,SO,PS,SD,SS,SY,TN,USA,UK,YE,AW,BQ,SX,NL",
    "Green Jade":
      "AF,BE,BG,CU,CY,FR,HK,IR,IQ,IL,LY,MY,NL,SG,SD,SY,PH,USA,AG,MO",
    Igrosoft: "",
    KAGaming: "TW",
    "Lotto Instant Win": "",
    OneTouch: "AU,KY,FR,HK,HU,IR,IQ,IL,MM,KP,PL,SA,SG,SY,TR,USA,UK,VA",
    "RTG SLOTS":
      "AF,AS,AO,AU,BE,BA,KH,HR,CZ,CD,DE,ET,HU,IR,IQ,IT,LA,LV,LT,RO,SG,SY,UG,USA,UK,VU,YE,DE,IL,CU,BG,ES,SE,PT,CO,EE,HK,PH",
    Spadegaming: "USA,IL,AU,CN,TH,ID,MY,VN",
    "Super Spade Gaming": "BY,USA,RU,UA",
    Vivogaming: "USA,IL,AR,CO,SY,IR",
    XProgaming: "IL,USA,MD,KR",
    CasinoTechnology: "USA,CA",
    "Belatra Games": "BY",
    Gamshy: "CN,HK,IT,MO,UK,GB,USA",
    Caleta: "USA",
  };
  return providerlist[provider];
};

exports.compoundauto = async (doc) => {
  const balancesService = new BalancesService();
  const wallet_data = await dbModel.wallet.findOne({ user_id: doc.userId });
  const balances = await balancesService.getWalletBalances(wallet_data.user_id);
  let userbal = balances[doc.currency];
  let userid = doc.userId;
  let currency = doc.currency;
  let calBal = parseFloat(userbal);

  let tronLink = await tronBeanLink();
  let instance = await tronLink.contract().at(config.trx.beancontract);
  var freezed_token = await instance.freezeOf(doc.userId).call();
  var freezed = Number(freezed_token._hex) / 1000000;
  var profit_amount = freezed < doc.tokens ? 0 : doc.profit;

  if (profit_amount > 0) {
    calBal = parseFloat(userbal) + parseFloat(doc.amount);
  } else {
    calBal = parseFloat(userbal) - parseFloat(doc.amount);
  }

  const newUserBalance = await balancesService.setWalletBalance(
    doc.userId,
    doc.currency,
    calBal
  );

  if (newUserBalance) {
    io.emit("getBal", {
      balance: newUserBalance,
      address: userid,
      currency: currency,
    });
    const stakedataupdate = await dbModel.staking.updateOne(
      { _id: doc._id },
      { $set: { status: 1 } }
    );

    if (stakedataupdate && profit_amount > 0) {
      const balancesService = new BalancesService();
      const wallet_data = await dbModel.wallet.findOne({ user_id: doc.userId });
      const balances = await balancesService.getWalletBalances(
        wallet_data.user_id
      );
      let userbal = balances[doc.currency];
      let newstakeamount = parseFloat(doc.amount) + parseFloat(doc.profit);
      const bean_data = await dbModel.bean
        .findOne({ userId: doc.userId })
        .lean();
      let stakeprofit = stakeprofit_calculation(
        newstakeamount,
        doc.periods,
        bean_data.freeze
      );
      let profit = parseFloat(stakeprofit);

      if (userbal >= newstakeamount) {
        let calBal = parseFloat(userbal) - parseFloat(newstakeamount);
        const newUserBalance = await balancesService.setWalletBalance(
          doc.userId,
          doc.currency,
          calBal
        );

        io.emit("getBal", {
          balance: newUserBalance,
          address: doc.userId,
          currency: doc.currency,
        });

        const restake_data = {
          userId: doc.userId,
          amount: newstakeamount,
          periods: doc.periods,
          currency: doc.currency,
          status: 0,
          autoOption: doc.autoOption,
          profit: profit.toFixed(2),
          tokens: bean_data.freeze,
        };

        let stack_create = await dbModel.staking.create(restake_data);
      }
    }
  }
};

exports.reinvestauto = async (doc) => {
  const balancesService = new BalancesService();
  const wallet_data = await dbModel.wallet.findOne({ user_id: doc.userId });
  const balances = await balancesService.getWalletBalances(wallet_data.user_id);
  let userbal = balances[doc.currency];
  let userid = doc.userId;
  let currency = doc.currency;
  let calBal = parseFloat(userbal);

  let tronLink = await tronBeanLink();
  let instance = await tronLink.contract().at(config.trx.beancontract);
  var freezed_token = await instance.freezeOf(doc.userId).call();
  var freezed = Number(freezed_token._hex) / 1000000;
  var profit_amount = freezed < doc.tokens ? 0 : doc.profit;

  if (profit_amount > 0) {
    calBal = parseFloat(userbal) + parseFloat(doc.amount);
  } else {
    calBal = parseFloat(userbal) - parseFloat(doc.amount);
  }

  const newUserBalance = await balancesService.setWalletBalance(
    doc.userId,
    doc.currency,
    calBal
  );

  if (newUserBalance) {
    io.emit("getBal", {
      balance: newUserBalance,
      address: userid,
      currency: currency,
    });
    const stakedataupdate = await dbModel.staking.updateOne(
      { _id: doc._id },
      { $set: { status: 1 } }
    );

    if (stakedataupdate) {
      const profit_data = {
        userId: doc.userId,
        profit: profit_amount,
        currency: doc.currency,
        period: doc.periods,
      };
      const profitdata_create = await dbModel.stakeprofit.create(profit_data);
      if (profitdata_create && profit_amount > 0) {
        const balancesService = new BalancesService();
        const wallet_data = await dbModel.wallet.findOne({
          user_id: doc.userId,
        });
        const balances = await balancesService.getWalletBalances(
          wallet_data.user_id
        );
        let userbal = balances[doc.currency];
        if (userbal >= doc.amount) {
          let calBal = parseFloat(userbal) - parseFloat(doc.amount);
          const newUserBalance = await balancesService.setWalletBalance(
            doc.userId,
            doc.currency,
            calBal
          );

          io.emit("getBal", {
            balance: newUserBalance,
            address: doc.userId,
            currency: doc.currency,
          });

          const bean_data = await dbModel.bean
            .findOne({ userId: doc.userId })
            .lean();
          let stakeprofit = stakeprofit_calculation(
            doc.amount,
            doc.periods,
            bean_data.freeze
          );
          let profit = parseFloat(stakeprofit);

          const restake_data = {
            userId: doc.userId,
            amount: doc.amount,
            periods: doc.periods,
            currency: doc.currency,
            status: 0,
            autoOption: doc.autoOption,
            profit: profit.toFixed(2),
            tokens: bean_data.freeze,
          };

          let stack_create = await dbModel.staking.create(restake_data);
        }
      }
    }
  }
};

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

exports.normalauto = async (doc) => {
  const balancesService = new BalancesService();
  const wallet_data = await dbModel.wallet.findOne({ user_id: doc.userId });
  const balances = await balancesService.getWalletBalances(wallet_data.user_id);
  let userbal = balances[doc.currency];
  let userid = doc.userId;
  let currency = doc.currency;
  let calBal = parseFloat(userbal);

  let tronLink = await tronBeanLink();
  let instance = await tronLink.contract().at(config.trx.beancontract);
  var freezed_token = await instance.freezeOf(doc.userId).call();
  var freezed = Number(freezed_token._hex) / 1000000;
  var profit_amount = freezed < doc.tokens ? 0 : doc.profit;

  if (profit_amount > 0) {
    calBal = parseFloat(userbal) + parseFloat(doc.amount);
  }

  const newUserBalance = await balancesService.setWalletBalance(
    doc.userId,
    doc.currency,
    calBal
  );
  if (newUserBalance) {
    io.emit("getBal", {
      balance: newUserBalance,
      address: userid,
      currency: currency,
    });
    const stakedataupdate = await dbModel.staking.updateOne(
      { _id: doc._id },
      { $set: { status: 1 } }
    );

    if (stakedataupdate) {
      const profit_data = {
        userId: doc.userId,
        profit: profit_amount,
        currency: doc.currency,
        period: doc.periods,
      };
      const profitdata_create = await dbModel.stakeprofit.create(profit_data);
    }
  }
};

exports.calLoseWin = async (type, userId) => {
  const today = new Date();
  const tdy_day = today.getDay();
  let daysToCal;
  switch (tdy_day) {
    case 5:
      daysToCal = 1;
      break;
    case 6:
      daysToCal = 2;
      break;
    case 0:
      daysToCal = 3;
      break;
    case 1:
      daysToCal = 4;
      break;
    case 2:
      daysToCal = 5;
      break;
    case 3:
      daysToCal = 6;
      break;
    case 4:
      daysToCal = 7;
      break;
  }

  const utcHr = daysToCal === 1 ? today.getUTCHours() : 24;

  const matchQueryDice = {
    userId: userId,
    currency: "TRX",
    createddate: {
      $gt: new Date(Date.now() - utcHr * 60 * 60 * 1000 * daysToCal),
    },
    rank: { $gte: 2 },
  };
  let amountReduction;

  if (type === "lose") {
    matchQueryDice.status = 0;
    amountReduction = { $sum: "$betAmount" };
  } else {
    matchQueryDice.status = 1;
    amountReduction = { $sum: { $subtract: ["$payout", "$betAmount"] } };
  }

  const diceData = await dbModel.dice.aggregate([
    { $match: matchQueryDice },
    { $group: { _id: "$userId", betAmount: amountReduction } },
  ]);
  const circleData = await dbModel.circle.aggregate([
    { $match: matchQueryDice },
    { $group: { _id: "$userId", betAmount: amountReduction } },
  ]);

  let totalData;
  const diceCalData = diceData.length == 0 ? 0 : diceData[0].betAmount;
  const circleCalData = circleData.length == 0 ? 0 : circleData[0].betAmount;
  totalData = parseFloat(diceCalData) + parseFloat(circleCalData);
  return totalData;
};

const tronWebLink = async () => {
  return new TronWeb({
    fullNode: config.trx.tronEnv,
    solidityNode: config.trx.tronEnv,
    eventServer: config.trx.tronEvent,
    privateKey: await decrypt(config.trx.tronKey),
  });
};

const tronBeanLink = async () => {
  return new TronWeb({
    fullNode: config.trx.tronEnv,
    solidityNode: config.trx.tronEnv,
    eventServer: config.trx.tronEvent,
    privateKey: await decrypt(config.trx.beantronkey),
  });
};

const tronMintLink = async () => {
  return new TronWeb({
    fullNode: config.trx.tronEnv,
    solidityNode: config.trx.tronEnv,
    eventServer: config.trx.tronEvent,
    privateKey: await decrypt(config.trx.tronmintKey),
  });
};

// round
const getLuckyNo = (Min_rand, Max_rand) => {
  const min = Math.ceil(Min_rand);
  const max = Math.floor(Max_rand);
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// todo - ??!!
const updateWalCircle = async (user_id, amount) => {
  const wallet = await dbModel.wallet.findOne({ user_id: user_id }).lean();
  const amountToUpdate = wallet.trx_wallet.amount / 1000000;
};

const generateRandomValues = (maxValue, label) => {
  const engine = nodeCrypto;
  const distribution = integer(0, maxValue);
  const luckyNumber = distribution(engine);
  const secretKey = uuid4(engine);
  const hash = crypto
    .createHmac("sha256", secretKey)
    .update(String(label[luckyNumber]))
    .digest("hex");
  return { secretKey, luckyNumber, hash };
};

const preparingNext = () => {
  const label = [
    "50X",
    "5X",
    "2X",
    "3X",
    "2X",
    "3X",
    "2X",
    "3X",
    "2X",
    "5X",
    "2X",
    "5X",
    "2X",
    "3X",
    "2X",
    "3X",
    "2X",
    "3X",
    "2X",
    "5X",
    "2X",
    "5X",
    "2X",
    "3X",
    "2X",
    "3X",
    "2X",
    "3X",
    "2X",
    "3X",
    "2X",
    "3X",
    "2X",
    "5X",
    "2X",
    "5X",
    "2X",
    "3X",
    "2X",
    "3X",
    "2X",
    "3X",
    "2X",
    "5X",
    "2X",
    "5X",
    "2X",
    "3X",
    "2X",
    "3X",
    "2X",
    "3X",
    "2X",
    "5X",
  ];
  const randomValues = generateRandomValues(53, label);
  return {
    data: "Result",
    level: label[randomValues.luckyNumber],
    levelIndex: randomValues.luckyNumber,
    key: randomValues.secretKey,
    hash: randomValues.hash,
  };
};

const createCurrentGameRound = async (nextRound) => {
  const data = {
    level: nextRound.level,
    levelIndex: nextRound.levelIndex,
    secretKey: nextRound.key,
    hash: nextRound.hash,
  };
  const create = await dbModel.circleRound.create(data);
  const formedData = {
    game: "circle",
    user_id: create.roundId,
    luckyNumber: nextRound.levelIndex,
    secretKey: nextRound.key,
    hash: nextRound.hash,
  };
  const gameExists = await dbModel.currentGame
    .findOne({ game: "circle" })
    .lean();
  if (gameExists) {
    await dbModel.currentGame.update({ game: "circle" }, { $set: formedData });
  } else {
    await dbModel.currentGame.create(formedData);
  }
  return create.roundId;
};

const updateRoundBal = async (roundId, level, io) => {
  const balancesService = new BalancesService();
  const poolService = new PoolService();
  const circeData = await dbModel.circle.find({
    roundId: roundId,
    level: level,
  });
  const poolAmountToUpdate = {
    TRX: 0,
    MATIC: 0,
    ETH: 0,
  };
  let shareData = [];
  let arrayId = [];
  if (!circeData || !circeData.length) return;

  const winByCurrency = Array.from(circeData).reduce((acc, data) => {
    const key = `${data.currency.toUpperCase()}__${data.userId}`;

    acc[key] = (acc[key] || 0) + data.payout;
    return acc;
  }, {});

  const promises = Object.entries(winByCurrency).reduce(
    (acc, [currency__user, value]) => {
      if (value) {
        const [currency, userId] = currency__user.split("__");
        acc.push(balancesService.addUserBalance(userId, currency, value));
      }
      return acc;
    },
    []
  );

  await Promise.all(promises);

  // const bulkOperatorWallet = await dbModel.wallet.collection.initializeUnorderedBulkOp();
  for (const currentCircle of Array.from(circeData)) {
    const { currency, userId, _id: circleId } = currentCircle;
    const payout = +currentCircle.payout;
    const betAmount = +currentCircle.betAmount;

    arrayId.push(circleId);

    const {
      poolAmount,
      fakePoolAmount,
    } = await poolService.getPoolAmountByCurrencyCode(currency);

    const newPoolAmount = poolAmount - payout;
    const newFakePoolAmount = fakePoolAmount - payout;

    poolAmountToUpdate[currency] = (poolAmountToUpdate[currency] || 0) + payout;
    shareData.push({
      userId,
      game: "Circle",
      betamount: betAmount,
      win: 1,
      real_org: poolAmount,
      fake_org: poolAmount,
      in_amt: 0,
      out_amt: payout,
      real_mod: newPoolAmount,
      fake_mod: newFakePoolAmount,
      shared_percentage: 0,
      shared_amount: 0,
    });
  }

  await dbModel.circle.update(
    { _id: { $in: arrayId } },
    { $set: { status: 1 } },
    { multi: true }
  );

  const alldata = await allWinnerdata();
  io.emit("allGameData", alldata);

  if (shareData.length > 0) {
    await dbModel.share.insertMany(shareData);
  }
  for (let i = 0; i < circeData.length; i++) {
    const { _id, currency, userId } = circeData[i];
    const balances = await balancesService.getWalletBalances(userId);
    const balance = balances[currency];
    await dbModel.circle.update({ _id }, { $set: { balAfterBet: balance } });
    io.emit("getBal", {
      balance,
      address: userId,
      currency,
    });
  }

  for (const [key, value] of Object.entries(poolAmountToUpdate)) {
    if (value > 0) {
      await poolService.updatePoolAmount(-value, key);
    }
  }
};

const timerReHit = async (io) => {
  let myVar;
  let timeLeft = 20;
  const preparingData = await preparingNext();
  const circleData = await createCurrentGameRound(preparingData);

  io.emit("hash", preparingData.hash);

  const triggerCount = async () => {
    if (timeLeft > 0) {
      timeLeft = (timeLeft - 0.01).toFixed(2);
      if (timeLeft === "19.90") io.emit("startAuto", {});
      io.emit("timer", { countdown: timeLeft, roundId: circleData });
    } else {
      clearInterval(myVar);
      await sleep(1000);
      io.emit("showResult", preparingData);
      await sleep(7000);
      io.emit("preparingNext", { data: "Preparing Next Round" });

      let lastRoundId = await redis.getLastRoundId();

      if (lastRoundId !== circleData) {
        await updateRoundBal(circleData, preparingData.level, io);
        await redis.setLastRoundId(circleData);
      }

      await sleep(7000);
      io.emit(
        "circleRoundList",
        await dbModel.circleRound.find().sort({ _id: -1 }).limit(40)
      );
      await timerReHit(io);
    }
  };

  myVar = setInterval(triggerCount, 15);
};

exports.upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: "crypcade/images",
    key: function (req, file, cb) {
      cb(
        null,
        file.originalname.split(".")[0] +
          new Date().getTime() +
          "." +
          file.originalname.split(".")[1]
      );
    },
  }),
});

exports.timerReHit = timerReHit;
exports.tronWebLink = tronWebLink;
exports.tronMintLink = tronMintLink;
exports.tronBeanLink = tronBeanLink;
