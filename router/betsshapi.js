const express = require("express");
const crypto = require("crypto");
const md5 = require("md5");
var shasum = crypto.createHash("sha1");
const router = express.Router();
const fetch = require("node-fetch");
const common = require("../helpers/common");
const { dbModel } = require("../model/db");
const BalancesService = require("../services/balances");
const PoolService = require("../services/pool");
const { async } = require("@babel/runtime/regenerator");
let httpBuildQuery = require("http-build-query");
const config = require("../config");
let merchanturl = config.slotgat.merchanturl;
let merchantkey = config.slotgat.merchantkey;
let merchantid = config.slotgat.merchantid;
let nonce = noncegeneration(32);
const path = require("path");
var fs  = require('fs');


router.get("/getgameslist", async (req, res) => {
  console.log("gamlelost");
  fetch("https://api.c27.games/v1/", {
    method: "POST",
    body: JSON.stringify({
      "jsonrpc": "2.0",
      "method": "Game.List",
      "id": 1920911592
      }),
     agentOptions: {
      //  key: fs.readFileSync(path.join(__dirname,'Nodedetails','client.key')),
      //  cert: fs.readFileSync(path.join(__dirname,'Nodedetails','client.crt')),
       ca:fs.readFileSync(path.join(__dirname,'Nodedetails','apikey.pem'))
  
    },                                                                                                                                                                          
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((res) => console.log("resss", res))
    // .then(async function (error, httpResponse, body) {
    //   console.log("error", error);
    //   console.log("body", body);
    //   if (httpResponse) {
    //     res.json({ status: true, data: httpResponse });
    //   }
    // });
});

router.get("/btapiresponse", async (req, res) => {
  console.log("betsshcallback");
  res.json({status:true, msg:"betsshcallbackkkk"});
});

function signHmacSha1(key, str) {
  let hmac = crypto.createHmac("sha1", key);
  let signed = hmac.update(Buffer.from(str, "utf-8")).digest("hex");
  return signed;
}

function noncegeneration(length) {
  var text = "";
  var possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

async function signatureverification(data, headers) {
  const timestamp = headers["x-timestamp"];
  const nonce = headers["x-nonce"];
  const merchantid = headers["x-merchant-id"];
  const sign = headers["x-sign"];
  let custom_param = {
    "X-Merchant-Id": merchantid,
    "X-Nonce": nonce,
    "X-Timestamp": timestamp,
  };

  const request_param = data;
  let merge_param = Object.assign(custom_param, request_param);
  let sortable = [];
  for (let key in merge_param) {
    sortable.push(
      "" + encodeURIComponent(key) + "=" + encodeURIComponent(merge_param[key])
    );
  }
  sortable.sort();
  let hash_string = sortable.join("&");
  let x_sign = signHmacSha1(merchantkey, hash_string);

  if (x_sign === sign || data.action === "rollback") {
    return "success";
  } else {
    return "fail";
  }
}

router.post("/getproviderrestriction", async (req, res) => {
  let data = req.body;
  let terriorties = common.providerrestiction(data.provider);
  if (terriorties) {
    res.json({ status: true, data: terriorties });
  } else {
    res.json({ status: false });
  }
});

router.get("/getgames", async (req, res) => {
  const timestamp = Math.floor(Date.now() / 1000);
  let custom_param = {
    "X-Merchant-Id": merchantid,
    "X-Nonce": nonce,
    "X-Timestamp": timestamp,
  };
  let request_param = { page: 44 };
  let merge_param = Object.assign(custom_param, request_param);
  let sortable = [];
  for (let key in merge_param) {
    sortable.push(
      "" + encodeURIComponent(key) + "=" + encodeURIComponent(merge_param[key])
    );
  }
  sortable.sort();
  let hash_string = sortable.join("&");
  let x_sign = signHmacSha1(merchantkey, hash_string);
  fetch(merchanturl + "/games?page=44", {
    headers: {
      "X-Merchant-Id": merchantid,
      "X-Timestamp": timestamp,
      "X-Nonce": nonce,
      "X-Sign": x_sign,
    },
  })
    .then((res) => res.json())
    .then(async function (data) {
      console.log("gamedataaaa", data);
      if (data.items) {
        let gamedata = data.items;
        for (var i in gamedata) {
          let provider_id = common.providerId(gamedata[i].provider);
          if (provider_id) {
            const game_data = await dbModel.games.findOne({
              reference: gamedata[i].uuid,
            });
            if (!game_data) {
              const insData = {
                type_id: config.slotgat.type_id,
                image: gamedata[i].image,
                game: gamedata[i].type,
                reference: gamedata[i].uuid,
                description: gamedata[i].name,
                status: 1,
                url: "",
                provider: gamedata[i].provider,
                provider_id: provider_id,
                referenceName: gamedata[i].name,
                tagName: "",
                nameSearch: gamedata[i].name,
              };
              let ins = await dbModel.games.create(insData);
            }
          } else {
            console.log("providermissing");
          }

          // if(retArr==len)
          // {
          //   res.json({status:true})
          // }
        }
      }
    });
});

router.post("/gettestresult", async function (req, res) {
  const timestamp = Math.floor(Date.now() / 1000);
  let custom_param = {
    "X-Merchant-Id": merchantid,
    "X-Nonce": nonce,
    "X-Timestamp": timestamp,
  };
  let request_param = req.body;
  let merge_param = Object.assign(custom_param, request_param);
  let sortable = [];
  for (let key in merge_param) {
    sortable.push(
      "" + encodeURIComponent(key) + "=" + encodeURIComponent(merge_param[key])
    );
  }
  sortable.sort();
  var details = req.body;
  var formBody = [];
  for (var property in details) {
    var encodedKey = encodeURIComponent(property);
    var encodedValue = encodeURIComponent(details[property]);
    formBody.push(encodedKey + "=" + encodedValue);
  }
  formBody = formBody.join("&");
  let hash_string = sortable.join("&");
  let x_sign = signHmacSha1(merchantkey, hash_string);
  fetch(merchanturl + "/self-validate", {
    method: "POST",
    body: formBody,
    headers: {
      "X-Merchant-Id": merchantid,
      "X-Timestamp": timestamp,
      "X-Nonce": nonce,
      "X-Sign": x_sign,
      "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
    },
  })
    .then((res) => res.json())
    .then(async function (data) {
      console.log("testdataaaa", data);
      if (data) {
        res.json({ status: true, data: data });
      }
    });
});

router.post("/getdemourl", async function (req, res) {
  const timestamp = Math.floor(Date.now() / 1000);
  let custom_param = {
    "X-Merchant-Id": merchantid,
    "X-Nonce": nonce,
    "X-Timestamp": timestamp,
  };
  let request_param = req.body;
  let merge_param = Object.assign(custom_param, request_param);
  let sortable = [];
  for (let key in merge_param) {
    sortable.push(
      "" + encodeURIComponent(key) + "=" + encodeURIComponent(merge_param[key])
    );
  }
  sortable.sort();
  var details = req.body;
  var formBody = [];
  for (var property in details) {
    var encodedKey = encodeURIComponent(property);
    var encodedValue = encodeURIComponent(details[property]);
    formBody.push(encodedKey + "=" + encodedValue);
  }
  formBody = formBody.join("&");
  let hash_string = sortable.join("&");
  let x_sign = signHmacSha1(merchantkey, hash_string);
  fetch(merchanturl + "/games/init-demo", {
    method: "POST",
    body: formBody,
    headers: {
      "X-Merchant-Id": merchantid,
      "X-Timestamp": timestamp,
      "X-Nonce": nonce,
      "X-Sign": x_sign,
      "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
    },
  })
    .then((res) => res.json())
    .then(async function (data) {
      if (data) {
        res.json({ status: true, data: data.url });
      }
    });
});

router.post("/sgapiresponse", async (req, res) => {
  const data = req.body;
  console.log("slotgatdata", data);
  const headers = req.headers;
  let sign_verify = await signatureverification(data, headers);
  let data_type = data.type;
  let userid = data.player_id;
  let session = data.session_id;
  let amount = data.amount;

  if (!userid || !session) {
    res.json({
      error_code: "INTERNAL_ERROR",
      error_description: "Not a valid user",
    });
    return;
  }

  if (sign_verify != "success") {
    res.json({
      error_code: "INTERNAL_ERROR",
      error_description: "Not a valid signature",
    });
    return;
  }

  const wallet = await dbModel.wallet.findOne({ _id: userid }).lean();

  if (!wallet) {
    res.json({
      error_code: "INTERNAL_ERROR",
      error_description: "Not a valid user",
    });
    return;
  }

  const currency = session.split("CUR")[1];
  let cur = await common.eurconverter(currency);
  const balancesService = new BalancesService();
  const pow_div_curr = await balancesService.get_currmultiplier(currency);

  const tronAddr = wallet.user_id;

  if (data.action === "balance") {
    const balances = await balancesService.getWalletBalances(wallet.user_id);
    const userbalance = balances[currency];
    let convuserbalance = parseFloat(userbalance) * parseFloat(cur);
    convuserbalance = convuserbalance.toFixed(5);
    res.json({ balance: convuserbalance });
  } else if (data.action === "bet") {
    const user = await dbModel.users.findOne({ user_id: tronAddr }).lean();
    const slotsData = await dbModel.slots
      .findOne({ remotetranid: data.transaction_id })
      .lean();
    const balances = await balancesService.getWalletBalances(wallet.user_id);
    const userbalance = balances[currency];
    let convuserbalance = parseFloat(userbalance) * parseFloat(cur);
    convuserbalance = parseFloat(convuserbalance).toFixed(5);
    // const refundData = await dbModel.slots
    // .findOne({ trntype: "REFUND", roundid:data.transaction_id })
    // .lean();

    if (data.amount == "0" || data.amount == 0) {
      res.json({
        balance: convuserbalance,
        transaction_id: data.transaction_id,
      });
      return;
    } else if (parseFloat(data.amount) > parseFloat(convuserbalance)) {
      res.json({
        error_code: "INSUFFICIENT_FUNDS",
        error_description: "Not enough money to continue playing",
      });
      return;
    } else if (!slotsData && amount > 0) {
      const newbetamount = parseFloat(amount) / parseFloat(cur);
      let set = "";
      const updateNew = newbetamount > 0 ? -newbetamount * pow_div_curr : 0;
      const game_data = await dbModel.games.findOne({
        reference: data.game_uuid,
      });

      const betData = {
        providerid: game_data.provider_id,
        gameid: data.game_uuid,
        gameName: game_data.referenceName,
        md5: data.session_id,
        amount: -newbetamount,
        remotetranid: data.transaction_id,
        trntype: data_type.toUpperCase(),
        roundid: data.round_id ? data.round_id : data.transaction_id,
        userid: userid,
        finished: data.finished ? data.finished : 0,
        freespin_id: data.freespin_id ? data.freespin_id : 0,
        rank: user.rank,
        currency: currency,
      };
      await dbModel.slots.create(betData);
      if (data.type != "freespin") {
        set = {
          $inc: { [`${currency.toLowerCase()}_wallet.amount`]: updateNew },
        };
        const walletupd = await dbModel.wallet.findOneAndUpdate(
          {
            _id: userid,
          },
          set,
          { new: true }
        );
        await updateShare(betData, tronAddr, currency);
      }

      const balancesnw = await balancesService.getWalletBalances(
        wallet.user_id
      );
      const userBal = balancesnw[currency];
      let convnewuserbalance = parseFloat(userBal) * parseFloat(cur);
      convnewuserbalance = convnewuserbalance.toFixed(5);
      if (data.type != "freespin") {
        const tokenData = {
          userId: tronAddr,
          betAmount: newbetamount,
          game_type: 2,
          currency: currency,
        };
        await common.ticketSystem(tokenData);
        await common.placeToken(tokenData);
      }

      io.emit("getBal", {
        balance: userBal,
        address: tronAddr,
        currency: currency,
      });

      res.json({
        balance: convnewuserbalance,
        transaction_id: data.transaction_id,
      });
    } else {
      const balances = await balancesService.getWalletBalances(wallet.user_id);
      const userbalance = balances[currency];
      let convuserbalance = parseFloat(userbalance) * parseFloat(cur);
      convuserbalance = convuserbalance.toFixed(5);
      res.json({
        balance: convuserbalance,
        transaction_id: slotsData.remotetranid,
      });
    }
  } else if (data.action === "win") {
    const user = await dbModel.users.findOne({ user_id: tronAddr }).lean();
    const slotsData = await dbModel.slots
      .findOne({ remotetranid: data.transaction_id })
      .lean();

    if (!slotsData) {
      const newwinamount =
        parseFloat(amount) > 0 ? parseFloat(amount) / parseFloat(cur) : 0;
      let set = "";
      const updateNew = newwinamount > 0 ? newwinamount * pow_div_curr : 0;
      const game_data = await dbModel.games.findOne({
        reference: data.game_uuid,
      });

      const winData = {
        providerid: game_data.provider_id,
        gameid: data.game_uuid,
        gameName: game_data.referenceName,
        md5: data.session_id,
        amount: newwinamount,
        remotetranid: data.transaction_id,
        trntype: "WIN",
        roundid: data.round_id ? data.round_id : data.transaction_id,
        userid: userid,
        finished: data.finished ? data.finished : 0,
        freespin_id: data.freespin_id ? data.freespin_id : 0,
        rank: user.rank,
        currency: currency,
      };
      await dbModel.slots.create(winData);
      if (updateNew > 0) {
        set = {
          $inc: { [`${currency.toLowerCase()}_wallet.amount`]: updateNew },
        };
        const walletupd = await dbModel.wallet.findOneAndUpdate(
          {
            _id: userid,
          },
          set,
          { new: true }
        );
        await updateShare(winData, tronAddr, currency);
      }
      const balancesnw = await balancesService.getWalletBalances(
        wallet.user_id
      );
      await common.slotwinmultipler(data.round_id);
      const userBal = balancesnw[currency];
      let convnewuserbalance = parseFloat(userBal) * parseFloat(cur);
      convnewuserbalance = convnewuserbalance.toFixed(5);
      io.emit("getBal", {
        balance: userBal,
        address: tronAddr,
        currency: currency,
      });

      res.json({
        balance: convnewuserbalance,
        transaction_id: data.transaction_id,
      });
    } else {
      const balances = await balancesService.getWalletBalances(wallet.user_id);
      const userbalance = balances[currency];
      let convuserbalance = parseFloat(userbalance) * parseFloat(cur);
      convuserbalance = convuserbalance.toFixed(5);
      res.json({
        balance: convuserbalance,
        transaction_id: slotsData.remotetranid,
      });
    }
  } else if (data.action === "refund") {
    const user = await dbModel.users.findOne({ user_id: tronAddr }).lean();
    const slotsData = await dbModel.slots
      .findOne({ remotetranid: data.transaction_id })
      .lean();
    const refn_data = await dbModel.slots
      .findOne({ trntype: "REFUND", roundid: data.bet_transaction_id })
      .lean();
    const slotsdupData = await dbModel.slots
      .findOne({ remotetranid: data.bet_transaction_id, trntype: "BET" })
      .lean();

    const balances = await balancesService.getWalletBalances(wallet.user_id);
    const userbalance = balances[currency];
    let convuserbalance = parseFloat(userbalance) * parseFloat(cur);
    convuserbalance = convuserbalance.toFixed(5);

    if (parseFloat(data.amount) > convuserbalance) {
      // res.json({
      //   error_code: "INVALID_REFUNDAMOUNT",
      //   error_description: "Invalid Refund Amount",
      // });
      res.json({
        balance: convuserbalance,
        transaction_id: data.transaction_id,
      });
      return;
    }

    const game_data = await dbModel.games.findOne({
      reference: data.game_uuid,
    });

    const newwinamount =
      parseFloat(amount) > 0 ? parseFloat(amount) / parseFloat(cur) : 0;

    const winData = {
      providerid: game_data.provider_id,
      gameid: data.game_uuid,
      gameName: game_data.referenceName,
      md5: data.session_id,
      amount: newwinamount,
      remotetranid: data.transaction_id,
      trntype: "REFUND",
      roundid: data.bet_transaction_id,
      userid: userid,
      finished: data.finished ? data.finished : 0,
      freespin_id: data.freespin_id ? data.freespin_id : 0,
      rank: user.rank,
      currency: currency,
    };
    await dbModel.slots.create(winData);

    if (!slotsData && !refn_data && slotsdupData) {
      let set = "";
      const updateNew = newwinamount > 0 ? newwinamount * pow_div_curr : 0;

      set = {
        $inc: { [`${currency.toLowerCase()}_wallet.amount`]: updateNew },
      };
      const walletupd = await dbModel.wallet.findOneAndUpdate(
        {
          _id: userid,
        },
        set,
        { new: true }
      );
      await updateShare(winData, tronAddr, currency);
      const balancesnw = await balancesService.getWalletBalances(
        wallet.user_id
      );
      const userBal = balancesnw[currency];
      let convnewuserbalance = parseFloat(userBal) * parseFloat(cur);
      convnewuserbalance = convnewuserbalance.toFixed(5);
      io.emit("getBal", {
        balance: userBal,
        address: tronAddr,
        currency: currency,
      });

      res.json({
        balance: convnewuserbalance,
        transaction_id: data.transaction_id,
      });
    } else {
      const balances = await balancesService.getWalletBalances(wallet.user_id);
      const userbalance = balances[currency];
      let convuserbalance = parseFloat(userbalance) * parseFloat(cur);
      convuserbalance = convuserbalance.toFixed(5);
      res.json({
        balance: convuserbalance,
        transaction_id: data.transaction_id,
      });
    }
  } else if (data.action === "rollback") {
    const user = await dbModel.users.findOne({ user_id: tronAddr }).lean();
    const slotsData = await dbModel.slots
      .findOne({ remotetranid: data.transaction_id })
      .lean();

    let rollback_trans = [];
    rollback_trans = data.rollback_transactions;
    let rollback_tid = [];
    let deductamount = 0.0;

    for (var i in rollback_trans) {
      rollback_tid.push(rollback_trans[i].transaction_id);
      if (rollback_trans[i].type == "bet") {
        let betamount =
          parseFloat(rollback_trans[i].amount) > 0
            ? parseFloat(rollback_trans[i].amount) / parseFloat(cur)
            : 0;
        deductamount = parseFloat(deductamount) + parseFloat(betamount);
      } else if (rollback_trans[i].type == "win") {
        let winamount =
          parseFloat(rollback_trans[i].amount) > 0
            ? parseFloat(rollback_trans[i].amount) / parseFloat(cur)
            : 0;
        deductamount = parseFloat(deductamount) - parseFloat(winamount);
      }
    }

    if (!slotsData) {
      const newwinamount =
        parseFloat(amount) > 0 ? parseFloat(amount) / parseFloat(cur) : 0;
      const game_data = await dbModel.games.findOne({
        reference: data.game_uuid,
      });

      const winData = {
        providerid: game_data.provider_id,
        gameid: data.game_uuid,
        gameName: game_data.referenceName,
        md5: data.session_id,
        amount: newwinamount,
        remotetranid: data.transaction_id,
        trntype: "ROLLBACK",
        roundid: data.transaction_id,
        userid: userid,
        finished: data.finished ? data.finished : 0,
        freespin_id: data.freespin_id ? data.freespin_id : 0,
        rank: user.rank,
        currency: currency,
      };
      await dbModel.slots.create(winData);

      let set = "";
      const updateNew = deductamount * pow_div_curr;

      set = {
        $inc: { [`${currency.toLowerCase()}_wallet.amount`]: updateNew },
      };
      const walletupd = await dbModel.wallet.findOneAndUpdate(
        {
          _id: userid,
        },
        set,
        { new: true }
      );

      const balancesnw = await balancesService.getWalletBalances(
        wallet.user_id
      );
      const userBal = balancesnw[currency];
      let convnewuserbalance = parseFloat(userBal) * parseFloat(cur);
      convnewuserbalance = convnewuserbalance.toFixed(5);
      io.emit("getBal", {
        balance: userBal,
        address: tronAddr,
        currency: currency,
      });

      res.json({
        balance: convnewuserbalance,
        transaction_id: data.transaction_id,
        rollback_transactions: rollback_tid,
      });
    } else {
      const balances = await balancesService.getWalletBalances(wallet.user_id);
      const userbalance = balances[currency];
      let convuserbalance = parseFloat(userbalance) * parseFloat(cur);
      convuserbalance = convuserbalance.toFixed(5);
      res.json({
        balance: convuserbalance,
        transaction_id: data.transaction_id,
        rollback_transactions: rollback_tid,
      });
    }
  }
});

router.post("/getliveurl", async function (req, res) {
  const timestamp = Math.floor(Date.now() / 1000);
  let custom_param = {
    "X-Merchant-Id": merchantid,
    "X-Nonce": nonce,
    "X-Timestamp": timestamp,
  };
  let request_param = req.body;
  let merge_param = Object.assign(custom_param, request_param);
  let sortable = [];
  for (let key in merge_param) {
    sortable.push(
      "" + encodeURIComponent(key) + "=" + encodeURIComponent(merge_param[key])
    );
  }
  sortable.sort();
  var details = req.body;
  var formBody = [];
  for (var property in details) {
    var encodedKey = encodeURIComponent(property);
    var encodedValue = encodeURIComponent(details[property]);
    formBody.push(encodedKey + "=" + encodedValue);
  }
  formBody = formBody.join("&");
  let hash_string = sortable.join("&");
  let x_sign = signHmacSha1(merchantkey, hash_string);
  fetch(merchanturl + "/games/init", {
    method: "POST",
    body: formBody,
    headers: {
      "X-Merchant-Id": merchantid,
      "X-Timestamp": timestamp,
      "X-Nonce": nonce,
      "X-Sign": x_sign,
      "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
    },
  })
    .then((res) => res.json())
    .then(async function (data) {
      if (data) {
        res.json({ status: true, data: data.url });
      }
    });
});

const updateShare = async (data, tronAddr, currency) => {
  const poolService = new PoolService();
  const divisett = await dbModel.dividendSettings.findOne();
  const slotSettings = await dbModel.slotSettings.findOne();

  let slotWinAmount = 0;
  let slotBetAmount = 0;
  let refFeeAmount = 0;

  if (data.trntype == "BET") {
    const slotsBet = await dbModel.slots
      .findOne({ roundid: data.roundid, trntype: "BET" })
      .lean();
    slotBetAmount = slotsBet ? Math.abs(slotsBet.amount) : 0;
  }

  if (data.trntype == "WIN") {
    const slotsWin = await dbModel.slots
      .findOne({
        remotetranid: data.remotetranid,
        trntype: "WIN",
      })
      .lean();
    slotWinAmount = slotsWin ? slotsWin.amount : 0;
  }

  if (data.trntype == "REFUND") {
    const slotrefBet = await dbModel.slots
      .findOne({ remotetranid: data.roundid, trntype: "BET" })
      .lean();
    const slotsRef = await dbModel.slots
      .findOne({
        remotetranid: data.remotetranid,
        trntype: "REFUND",
      })
      .lean();
    refFeeAmount = slotrefBet
      ? (slotSettings.platipus_share / 100) * Math.abs(slotrefBet.amount)
      : 0;
    slotWinAmount = slotsRef
      ? parseFloat(slotsRef.amount) - parseFloat(refFeeAmount)
      : 0;
  }

  // for (let i = 0; i < slotsWin.length; i++) {
  //   slotWinAmount += +slotsWin[i].amount;
  // }

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
