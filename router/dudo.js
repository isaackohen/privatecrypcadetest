const express = require("express");
const router = express.Router();
const { dbModel } = require("../model/db");
const common = require("../helpers/common");
const BalancesService = require("../services/balances");
const PoolService = require("../services/pool");
const currencyCodes = require("../constants/currencyCodes");

const { Random, uuid4, integer, nodeCrypto } = require("random-js");
var crypto = require("crypto");

router.get("/get_dice", async function (req, res) {
  try {
    let diceData = await dbModel.dice.aggregate([
      {
        $match: { luckgen: 1 },
      },
      { $sort: { _id: -1 } },
      { $limit: 20 },
      {
        $lookup: {
          from: "Users",
          localField: "userId",
          foreignField: "user_id",
          as: "user_info",
        },
      },
      { $unwind: "$user_info" },
    ]);
    // var diceData = await dice.find({luckgen:1}).populate('userId').sort({ _id: -1 }).limit(20).lean();
    if (diceData) {
      res.json({ status: true, data: diceData });
    } else {
      res.json({ status: false, msg: "Unable to get list" });
    }
  } catch (e) {
    res.json({ status: false });
    console.log("get_dice", e);
  }
});

router.post("/getNewGame", common.tokenMiddleware, async function (req, res) {
  try {
    var alry_available = await dbModel.currentGame
      .findOne({ user_id: req.genuserId, game: "dice" })
      .lean();
    if (!alry_available) {
      const hash = createNewGame(req.genuserId);
      res.json({ status: true, msg: "", data: { hash } });
    } else {
      res.json({ status: false });
    }
  } catch (error) {
    res.json({ status: false, error });
  }
});

async function createNewGame(user_id) {
  const { luckyNumber, secretKey, hash } = generateRandomValues();
  try {
    const payload = {
      user_id,
      luckyNumber,
      secretKey,
      hash,
      game: "dice",
    };

    const createdGame = await dbModel.currentGame.create(payload); // TODO check what a failed attempt returns
  } catch (error) {
    throw error;
  }
}

function generateRandomValues() {
  const engine = nodeCrypto;
  const distribution = integer(0, 99);
  const luckyNumber = distribution(engine);
  const secretKey = uuid4(engine);
  const hash = crypto
    .createHmac("sha256", secretKey)
    .update(String(luckyNumber))
    .digest("hex");
  return { secretKey, luckyNumber, hash };
}

// router.get("/get_all_dice", common.whitelistMiddleware, async function(req, res) {
//   try {
//     var diceData = await dice.find().sort({ _id: -1 });
//     res.json({ status: true, data: diceData });
//   } catch (e) {
//     res.json({ status: false });
//     console.log("get_dice", e);
//   }
// });

router.post("/get_all_dice", common.whitelistMiddleware, async function (
  req,
  res
) {
  try {
    let pageNo = req.body.pageNo;
    let size = parseInt(req.body.size);
    let query = {};
    console.log(pageNo, size);
    if (pageNo > 0 && size > 0) {
      let skips = size * (pageNo - 1);
      let limits = size;
      let search = req.body.search;
      let status = req.body.status;
      if (search) {
        query = { userId: { $regex: ".*" + search + ".*", $options: "i" } };
      }
      query.status = status ? 1 : 0;
      let totalCount = await dbModel.dice.find(query).count();
      let diceData = await dbModel.dice
        .find(query)
        .skip(skips)
        .limit(limits)
        .sort({ _id: -1 })
        .lean();
      await diceData.map((items) => {
        items.prediction = parseInt(items.prediction);
        return items;
      });
      res.json({ status: true, data: diceData, count: totalCount });
    } else {
      res.json({ status: false, message: "Error fetching data" });
    }
  } catch (e) {
    res.json({ status: false });
    console.log("get_all_dice", e);
  }
});

router.get("/get_high_dice", common.whitelistMiddleware, async function (
  req,
  res
) {
  try {
    let diceData = await dbModel.dice.aggregate([
      {
        $match: { luckgen: 1, betAmount: { $gte: 10000 }, status: 1 },
      },
      { $sort: { _id: -1 } },
      {
        $lookup: {
          from: "Users",
          localField: "userId",
          foreignField: "user_id",
          as: "user_info",
        },
      },
      { $unwind: "$user_info" },
    ]);
    // var diceData = await dice.find({"betAmount":{"$gte": 10000},status:1,luckgen:1}).sort({ _id: -1 }).lean();
    // let diceUserData = await userUploads(diceData);
    res.json({ status: true, data: diceData });
  } catch (e) {
    res.json({ status: false });
    console.log("get_dice", e);
  }
});

router.get("/get_rare_dice", common.whitelistMiddleware, async function (
  req,
  res
) {
  try {
    let diceData = await dbModel.dice.aggregate([
      {
        $match: {
          $and: [
            { status: 1 },
            { luckgen: 1 },
            {
              $or: [
                { rollStatus: "<", prediction: { $lte: 4 } },
                { rollStatus: ">", prediction: { $gte: 95 } },
              ],
            },
          ],
        },
      },
      { $sort: { _id: -1 } },
      { $limit: 20 },
      {
        $lookup: {
          from: "Users",
          localField: "userId",
          foreignField: "user_id",
          as: "user_info",
        },
      },
      { $unwind: "$user_info" },
    ]);
    // var diceData = await dice.find({$and:[{"status":1},{"luckgen":1},{$or:[{"rollStatus": '<',"prediction":{"$lte":4}},{"rollStatus": '>',"prediction":{"$gte":95}}]}]}).limit(20).sort({_id:-1}).lean();
    // let diceUserData = await userUploads(diceData);
    res.json({ status: true, data: diceData });
  } catch (e) {
    res.json({ status: false });
    console.log("get_rare_dice", e);
  }
});

router.post("/gethash", common.tokenMiddleware, async function (req, res) {
  var get_user_id = req.genuserId;
  try {
    var alry_available = await dbModel.currentGame
      .findOne({ user_id: get_user_id, game: "dice" })
      .lean();
    if (alry_available) {
      let available = {
        hash: alry_available.hash,
      };
      res.json({ status: true, data: available });
    } else {
      res.json({ status: false });
    }
  } catch (e) {
    res.json({ status: false });
    console.log("gethash", e);
  }
});

router.post("/getinfo", common.tokenMiddleware, async function (req, res) {
  const balancesService = new BalancesService();
  var dice_data = await dbModel.dice
    .findOne({ userId: req.genuserId, cstatus: 0 })
    .lean();
  if (dice_data) {
    const currency = dice_data.currency || currencyCodes.TRX;
    const balAfterBet = await balancesService.setWalletBalance(
      req.genuserId,
      currency,
      parseFloat(dice_data.payout),
      "$inc"
    );
    io.emit("getBal", {
      balance: balAfterBet,
      address: req.genuserId,
      currency,
    });
    await dbModel.dice.updateOne(
      { _id: dice_data._id },
      { $set: { cstatus: 1, luckgen: 1, balAfterBet } }
    );
    await emitListSockets();
    res.json({ status: true });
  } else {
    var dce_data = await dbModel.dice
      .findOne({ userId: req.genuserId })
      .sort({ _id: -1 })
      .limit(1);
    if (dce_data) {
      let update = await dbModel.dice.updateOne(
        { _id: dce_data._id },
        { $set: { luckgen: 1 } }
      );
    }
    await emitListSockets();
    res.json({ status: false });
  }
});

let oArray = [];
function _intervalFunc(orderwith) {
  var index = oArray.indexOf(orderwith);
  if (index > -1) {
    oArray.splice(index, 1);
  }
}

router.post("/placebet", common.tokenMiddleware, async function (req, res) {
  const balancesService = new BalancesService();
  var data = req.body;
  let set = {};
  var get_user_id = req.genuserId;
  data.prediction = parseInt(data.prediction);
  data.amount = parseFloat(data.amount);
  const currency = data.currency || "TRX";
  var dicesett = await dbModel.diceSettings.findOne();
  const min_bet_dice =
    data.currency === "TRX"
      ? dicesett.min_betAmount
      : data.currency == "ETH"
      ? dicesett.min_betAmount_eth
      : data.currency == "MATIC"
      ? dicesett.min_betAmount_matic
      : dicesett.min_betAmount;
  const max_bet_dice =
    data.currency === "TRX"
      ? dicesett.max_betAmount
      : data.currency == "ETH"
      ? dicesett.max_betAmount_eth
      : data.currency == "MATIC"
      ? dicesett.max_betAmount_matic
      : dicesett.max_betAmount;
  try {
    const orderwith = oArray.indexOf(req.genuserId);
    if (orderwith === -1) {
      oArray.push(req.genuserId);
      setTimeout(function () {
        _intervalFunc(req.genuserId);
      }, 2000);
      let insertData = await dbModel.dice.findOne({
        userid: req.genuserId,
        createddate: { $gte: new Date(Date.now() - 2000) },
      });
      let findLuckgen = await dbModel.dice
        .findOne({ userId: req.genuserId })
        .sort({ _id: -1 })
        .lean();
      if (!findLuckgen || findLuckgen.luckgen) {
        if (!insertData) {
          const { luckyNumber, secretKey, hash } = generateRandomValues();
          const gameUpdate = { luckyNumber, secretKey, hash };
          const currentGame = await dbModel.currentGame.findOneAndUpdate(
            { user_id: get_user_id },
            gameUpdate
          );
          var gameData = await dbModel.games
            .findOne({ reference: "Dice" })
            .lean();
          var userData = await dbModel.userManagement.findOne({
            user_address: get_user_id,
            status: 0,
          });
          if (userData) {
            res.json({ status: false, error: "You are Blocked" });
            return false;
          }
          if (gameData.status === 0) {
            res.json({
              status: false,
              error: "Currently Game does not active",
            });
            return false;
          }
          if (!currentGame) {
            res.json({ status: false, error: "Current game does not exist" });
            return false;
          }
          const wallet_data = await dbModel.wallet.findOne({
            user_id: get_user_id,
          });
          const balances = await balancesService.getWalletBalances(
            wallet_data.user_id
          );
          const userbal = balances[currency];
          const pow_div_curr = await balancesService.get_currmultiplier(
            currency
          );

          // var userbal = findWallet.wallet[0].amount/1000000;
          // var sitesett = await siteSettings.findOne();
          // var divisett = await diviSettings.findOne();
          if (data.rollStatus === "over") {
            var min_prediction = dicesett.rollover_min;
            var max_prediction = dicesett.max_range;
            var winningChance = dicesett.max_prediction - data.prediction;
          } else {
            var min_prediction = dicesett.min_range;
            var max_prediction = dicesett.rollunder_max;
            var winningChance = data.prediction;
          }
          var multiplier = (dicesett.multiplier / winningChance).toFixed(4);
          var betAmount = data.amount * pow_div_curr;
          var profit = (data.amount * multiplier).toFixed(8);
          var profitToWin = profit * pow_div_curr;
          var max_bet = parseFloat(max_bet_dice) / parseFloat(multiplier);
          var max_amount = Math.round(max_bet);
          if (
            data.rollStatus &&
            (data.rollStatus === "over" || data.rollStatus === "under")
          ) {
            if (
              !isNaN(data.prediction) &&
              parseInt(data.prediction) >= min_prediction &&
              parseInt(data.prediction) <= max_prediction
            ) {
              if (data.amount > 0) {
                if (parseFloat(data.amount) <= parseFloat(userbal)) {
                  if (parseFloat(data.amount) <= parseFloat(max_amount)) {
                    if (parseFloat(data.amount) >= parseFloat(min_bet_dice)) {
                      let calBal =
                        parseFloat(userbal) - parseFloat(data.amount);
                      if (calBal >= 0) {
                        const newUserBalance = await balancesService.setWalletBalance(
                          get_user_id,
                          currency,
                          calBal
                        );
                        io.emit("getBal", {
                          balance: newUserBalance,
                          address: get_user_id,
                          currency,
                        });
                        const isOverWinning =
                          data.rollStatus === "over" &&
                          currentGame.luckyNumber > data.prediction;
                        const isUnderWinning =
                          data.rollStatus === "under" &&
                          currentGame.luckyNumber < data.prediction;
                        const winStatus = isOverWinning || isUnderWinning;

                        var dice_data = {
                          userId: get_user_id,
                          betAmount: data.amount,
                          prediction: data.prediction,
                          luckyNumber: currentGame.luckyNumber,
                          secretKey: currentGame.secretKey,
                          hash: currentGame.hash,
                          multiplier,
                          profit,
                          profitToWin,
                          userbal: userbal,
                          winningChance,
                          rollStatus: data.rollStatus,
                          winStatus,
                          currency,
                        };
                        res.json({
                          status: true,
                          msg: "lucky",
                          data: {
                            luckno: currentGame.luckyNumber,
                            win: winStatus,
                            hash: hash,
                          },
                        });
                        let sta = await savedicedata(dice_data);
                        // if(sta){
                        //   res.json({status:true,msg:'lucky',data:{luckno:currentGame.luckyNumber,win:winStatus,hash:hash}});
                        // }
                      } else {
                        res.json({
                          status: false,
                          error: "Insufficient Balance",
                        });
                      }
                    } else {
                      res.json({
                        status: false,
                        error:
                          "Bet Amount should be greater than or equal to Min Amount",
                      });
                    }
                  } else {
                    res.json({
                      status: false,
                      error: "Bet Amount should be less than Max Amount",
                    });
                  }
                } else {
                  res.json({ status: false, error: "Insufficient Balance" });
                }
              } else {
                res.json({ status: false, error: "Invalid Bet Amount" });
              }
            } else {
              res.json({ status: false, error: "Invalid Prediction" });
            }
          } else {
            res.json({ status: false, error: "Invalid User" });
          }
        } else {
          res.json({ status: false, error: "Unable to place bet" });
        }
      } else {
        let updateDice = await dbModel.dice.update(
          { _id: findLuckgen._id },
          { $set: { luckgen: 1 } }
        );
        res.json({
          status: false,
          error: "Please wait previous bet is under processing...",
        });
      }
    } else {
      res.json({ status: false, error: "Place bet after 2 seconds" });
    }
  } catch (e) {
    res.json({ status: false, error: e });
    console.log("placebet", e);
  }
});

router.post("/add_dice", common.tokenMiddleware, async function (req, res) {
  var data = req.body;
  try {
    var diceData = await dbModel.dice.create(data);
    if (diceData) {
      res.json({ status: true, msg: "Created Successfully!" });
    } else {
      res.json({ status: false, msg: "Unable to Create" });
    }
  } catch (e) {
    res.json({ status: false });
    console.log("add_dice", e);
  }
});

router.post("/dice_list", common.tokenMiddleware, async function (req, res) {
  var data = req.body;
  try {
    let diceData = await dbModel.dice.aggregate([
      {
        $match: { luckgen: 1, userId: data.userId },
      },
      { $sort: { _id: -1 } },
      { $limit: 20 },
      {
        $lookup: {
          from: "Users",
          localField: "userId",
          foreignField: "user_id",
          as: "user_info",
        },
      },
      { $unwind: "$user_info" },
    ]);
    if (diceData) {
      res.json({ status: true, data: diceData });
    } else {
      res.json({ status: false, msg: "Unable to get list" });
    }
  } catch (e) {
    res.json({ status: false });
    console.log("dice_list", e);
  }
});

router.post("/dice_userlist", common.tokenMiddleware, async function (
  req,
  res
) {
  var data = req.body;
  try {
    let pageNo = data.pageNo;
    let size = parseInt(data.size);
    let query = { userId: data.userId, luckgen: 1 };
    let skips = size * (pageNo - 1);
    let limits = size;
    let totalCount = await dbModel.dice.find(query).count();
    let diceData = await dbModel.dice
      .find(query)
      .skip(skips)
      .limit(limits)
      .sort({ _id: -1 })
      .lean();
    if (diceData) {
      res.json({ status: true, data: diceData, count: totalCount });
    } else {
      res.json({ status: false, msg: "Unable to get list" });
    }
  } catch (e) {
    res.json({ status: false });
    console.log("dice_list", e);
  }
});

router.get("/dice_listByProfit", async function (req, res) {
  try {
    let alldata = await common.allWinnerdata();
    res.json({ status: true, data: alldata });
  } catch (e) {
    res.json({ status: false });
    console.log("dice_listByProfit", e);
  }
});

router.get("/get_totalBet", common.whitelistMiddleware, async function (
  req,
  res
) {
  try {
    var totalData = await dbModel.dice.aggregate([
      { $match: { status: 1 } },
      { $group: { _id: null, amount: { $sum: "$betAmount" } } },
    ]);
    res.json({ status: true, data: totalData[0].amount });
  } catch (e) {
    res.json({ status: false });
    console.log("get_totalBet", e);
  }
});

router.get("/test", common.whitelistMiddleware, async function (req, res) {
  try {
    let slotData = await dbModel.slots
      .aggregate([
        {
          $match: {
            trntype: "WIN",
            amount: {
              $nin: ["0", "0.00"],
            },
          },
        },
      ])
      .limit(10);
    res.json({ status: true, data: slotData });
  } catch (e) {
    res.json({ status: false });
    console.log("get_totalBet", e);
  }
});

async function savedicedata(data) {
  const poolService = new PoolService();
  const balancesService = new BalancesService();
  const sitesett = await dbModel.siteSettings.findOne();
  const divisett = await dbModel.dividendSettings.findOne();
  const dicesett = await dbModel.diceSettings.findOne();
  const user_ref = await dbModel.users.findOne({ user_id: data.userId }).lean();
  let userbalnw;

  const amountToAddToPool = data.winStatus
    ? -(parseFloat(data.profit) - parseFloat(data.betAmount))
    : parseFloat(data.betAmount);
  const updatedSettings = await poolService.updatePoolAmount(
    amountToAddToPool,
    data.currency
  );
  io.emit("getdivi", { diviSettings: updatedSettings });

  const poolAmountKeysByCurrencyCode = poolService.getPoolAmountKeysByCurrencyCode(
    data.currency
  );
  const balances_nw = await balancesService.getWalletBalances(data.userId);
  userbalnw = balances_nw[data.currency];
  if (data.winStatus) {
    userbalnw = parseFloat(userbalnw) + parseFloat(data.profit);
  }
  // const

  const diceData_create = {
    prediction: data.prediction,
    luckyNumber: data.luckyNumber,
    secretKey: data.secretKey,
    hash: data.hash,
    betAmount: data.betAmount,
    multiplier: data.multiplier,
    payout: data.profit,
    status: data.winStatus ? 1 : 0,
    cstatus: data.winStatus ? 0 : 1,
    userId: data.userId,
    // TODO: check which of the next 2 values should change.
    balBeforeBet: data.userbal,
    balAfterBet: userbalnw,
    luckgen: 0,
    rank: user_ref ? user_ref.rank : 0,
    rollStatus: data.rollStatus === "over" ? ">" : "<",
    currency: data.currency,
  };

  let dic_create = await dbModel.dice.create(diceData_create);

  const real_org = divisett[poolAmountKeysByCurrencyCode.pool_amount];
  const fake_org = divisett[poolAmountKeysByCurrencyCode.fake_pool_amount];
  const real_mod = updatedSettings[poolAmountKeysByCurrencyCode.pool_amount];
  const fake_mod =
    updatedSettings[poolAmountKeysByCurrencyCode.fake_pool_amount];

  const poolData_create = {
    userid: data.userId,
    game: "Dice",
    betamount: data.betAmount,
    win: data.winStatus ? 1 : 0,
    in_amt: data.winStatus ? 0 : data.betAmount,
    out_amt: data.winStatus ? -amountToAddToPool : 0,
    real_org,
    fake_org,
    real_mod,
    fake_mod,
    shared_percentage: 0,
    shared_amount: 0,
    currency: data.currency,
  };

  await dbModel.share.create(poolData_create);

  let betData = {
    userId: data.userId,
    betAmount: data.betAmount,
    game_type: 1,
    currency: data.currency,
  };

  await common.ticketSystem(betData);
  await common.placeToken(betData);

  if(dic_create && data.winStatus){
     await common.dicewinmultipler(data.userId);
  }

  if (user_ref && !!user_ref.invitedBy && data.winStatus) {
    const profit_upd = parseFloat(data.profit) - parseFloat(data.betAmount);
    const usr_det = await dbModel.users
      .findOne({ _id: user_ref.invitedBy })
      .lean();
    const ref_percent = parseFloat(sitesett.referal_percent / 100) * profit_upd;
    const recve_amt = Number(ref_percent).toFixed(5);
    if (ref_percent > 0) {
      const refData = {
        userId: data.userId,
        ruserId: usr_det.user_id,
        game: "Dice",
        bet_amount: data.betAmount,
        win_amount: data.profit,
        commission_per: sitesett.referal_percent,
        received_amount: recve_amt,
        currency: data.currency,
      };
      await dbModel.gaugeShare.create(refData);
    }
  }
  return "success";
}

async function emitListSockets() {
  let alldata = await common.allWinnerdata();
  io.emit("allGameData", alldata);

  let diceData = await dbModel.dice.aggregate([
    {
      $match: { luckgen: 1 },
    },
    { $sort: { _id: -1 } },
    { $limit: 20 },
    {
      $lookup: {
        from: "Users",
        localField: "userId",
        foreignField: "user_id",
        as: "user_info",
      },
    },
    { $unwind: "$user_info" },
  ]);
  // var diceData = await dice.find({ luckgen: 1 }).sort({ _id: -1 }).limit(20);
  // let userdiceData = await userUploads(diceData);
  let profitData = await dbModel.dice.aggregate([
    {
      $match: { luckgen: 1, status: 1 },
    },
    { $sort: { payout: -1 } },
    { $limit: 8 },
    {
      $lookup: {
        from: "Users",
        localField: "userId",
        foreignField: "user_id",
        as: "user_info",
      },
    },
    { $unwind: "$user_info" },
  ]);
  // var profitData = await dice.find({ status: 1, luckgen:1}).sort({ payout: -1 }).limit(8);
  // let userprofitData= await userUploads(profitData);
  io.emit("getdicedata", { diceList: diceData, profitList: profitData });
}

async function userUploads(datum) {
  uData;
  return datum;
}

module.exports = router;
