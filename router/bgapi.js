const express = require("express");
const router = express.Router();

const { dbModel } = require("../model/db");
const common = require("../helpers/common");
const config = require("../config");
const {
  getFrequentBet,
  setFrequentBet,
  setBongoRequest,
  getBongoRequest,
} = require("../helpers/redis");
const { update } = require("../model/db/cms");
const BalancesService = require("../services/balances");
const PoolService = require("../services/pool");

router.post("/bgapiresponse", async (req, res) => {
  try {
    const data = req.body;
    const token_data = data.token;
    if(token_data.includes("CYRADE")===false){
      res.json({ uid: data.uid, error: { code: "INVALID_TOKEN" } });
      return;
    }
    const userid = data.token.split("CYRADE")[0];
    const currency = data.token.split("_")[1];

    const wallet = await dbModel.wallet.findOne({ _id: userid }).lean();
    if (!wallet) {
      res.json({ uid: data.uid, error: { code: "INVALID_TOKEN" } });
      return;
    }

    // todo - is not a standard response
    // if (await getFrequentBet(userid)) {
    //   res.json({ status: false, error: "Place bet after 2 seconds" });
    // }
    // await setFrequentBet(userid);

    // const oldSameRequest = await getBongoRequest(data.uid);
    // if (oldSameRequest) {
    //   res.json(oldSameRequest);
    //   return;
    // }

    const balancesService = new BalancesService();
    const balances = await balancesService.getWalletBalances(wallet.user_id);
    const balance = balances[currency];
    const timestamp = new Date().getTime(); // todo this must be saved for the next time user plays
    const tronAddr = wallet.user_id;
    const fixbal = balance.toFixed(5);

    const respObj = {
      uid: data.uid,
      balance: {
        value: `${fixbal}`,
        version: timestamp,
      },
    };

    let response;

    switch (data.name) {
      case "login":
        response = {
          ...respObj,
          player: {
            id: userid,
            brand: "crypcade",
            currency: currency,
            mode: "REAL", // FUN
            is_test: config.bgGames.isTest,
          },
          tag: "",
        };
        break;

      case "logout":
        response = { uid: data.uid };
        break;

      case "transaction":
        const sltotsData = await dbModel.slots
          .findOne({ remotetranid: data.uid })
          .lean();
        const betdata = data.args.bet || 0;
        const windata = data.args.win || 0;

        if (sltotsData) {
          response = respObj;
        } else {
        
          if (
            parseFloat(betdata) > parseFloat(fixbal) &&
            data.args.bonus == null
          ) {
            response = {
              ...respObj,
              error: { code: "FUNDS_EXCEED" },
            };
          } else {
            await slotDataUpdate(data, userid, tronAddr, currency);
            data.args.round_finished &&
              (await updateShare(data, tronAddr, currency));

            const walletnw = await dbModel.wallet
              .findOne({ _id: userid })
              .lean();
            const balancesServicenw = new BalancesService();
            const balancesnw = await balancesServicenw.getWalletBalances(
              walletnw.user_id
            );
            const balancenw = balancesnw[currency];
            const fixbalnw = balancenw.toFixed(5);
            const timestampnw = new Date().getTime();

            const respObjnw = {
              uid: data.uid,
              balance: {
                value: `${fixbalnw}`,
                version: timestampnw,
              },
            };

            response = respObjnw;
          }
        }

        // todo - get io here
        io.emit("rankUpgrade", { address: tronAddr });
        break;

      case "getbalance":
        const respObjnw = {
          uid: data.uid,
          balance: {
            value: `${fixbal}`,
            version: timestamp,
          },
        };
        response = respObjnw;
        break;
      case "rollback":
        const walletnw = await dbModel.wallet
              .findOne({ _id: userid })
              .lean();
        const balancesServicenw = new BalancesService();
        const balancesnw = await balancesServicenw.getWalletBalances(
          walletnw.user_id
        );
        const balancenw = balancesnw[currency];
        const fixbalnw = balancenw.toFixed(5);
        const timestampnw = new Date().getTime();

        let tran_data = await dbModel.slots.findOne({"remotetranid":data.args.transaction_uid}).lean();
	  		let trans_data = await dbModel.slots.findOne({"freespin_id":data.args.transaction_uid,"remotetranid":data.uid}).lean();
	  	  let bet_data = data.args.bet ? parseFloat(data.args.bet) : 0;

        if(data.args.transaction_uid!="00000000000000000000000000000000"){
	  			if(parseFloat(bet_data)<=parseFloat(fixbalnw) || data.args.bonus){
	  				if(tran_data && !trans_data){
	  					  await slotDataUpdate(data, userid, tronAddr, currency);
	      				await updateShare(data, tronAddr, currency);
	      			}

           const walletnw = await dbModel.wallet
              .findOne({ _id: userid })
              .lean();
           const balancesServicenw = new BalancesService();
           const balancesnw = await balancesServicenw.getWalletBalances(
              walletnw.user_id
            );
           const balancenw = balancesnw[currency];
           const fixbalnw = balancenw.toFixed(5);
           const timestampnw = new Date().getTime();

            const respObjnw = {
              uid: data.uid,
              balance: {
                value: `${fixbalnw}`,
                version: timestampnw,
              },
            };

            response = respObjnw;
	      
	      		}else{
              const respObjnw = {
                uid: data.uid,
                balance: {
                  value: `${fixbalnw}`,
                  version: timestampnw,
                },
              };
  
              response = respObjnw;
	      		}
	      	}else{
            const respObjnw = {
              uid: data.uid,
              balance: {
                value: `${fixbalnw}`,
                version: timestampnw,
              },
            };

            response = respObjnw;
	      	}
        
    }

    res.send(response);

    //save response to redis
    await setBongoRequest(response);
  } catch (error) {
    res.send(error);
    console.log("booongo", error);
  }
});

const slotDataUpdate = async (data, userid, tronAddr, currency) => {
  const balancesService = new BalancesService();

  const existingData = await dbModel.slots
    .findOne({ remotetranid: data.uid })
    .lean();
  if (existingData) return;

  const betAmount = data.args.bet && !data.args.bonus ? data.args.bet : 0;
  const winAmount = data.args.win ? data.args.win : 0;

  const user = await dbModel.users.findOne({ user_id: tronAddr }).lean();

  const currencynw =
    currency == "mETH" ? "ETH" : currency == "MA1" ? "MATIC" : currency;

  const betData = {
    providerid: 2,
    gameid: data.game_id,
    gameName: data.game_name,
    md5: data.session,
    amount: -betAmount,
    remotetranid: data.uid,
    trntype: "BET",
    roundid: data.args.round_id,
    userid: userid,
    finished: 0,
    roomid: data.token,
    freespin_id: data.args.transaction_uid,
    rank: user.rank,
    currency: currencynw,
  };
  await dbModel.slots.create(betData);

  const winData = {
    providerid: 2,
    gameid: data.game_id,
    gameName: data.game_name,
    md5: data.session,
    amount: winAmount,
    remotetranid: data.uid,
    trntype: "WIN",
    roundid: data.args.round_id,
    userid: userid,
    finished: 1,
    roomid: data.token,
    freespin_id: data.args.transaction_uid,
    rank: user.rank,
    currency: currencynw,
  };
  await dbModel.slots.create(winData);

  const updateAmount = betAmount - winAmount;
  const absAmount = Math.abs(updateAmount);

  let wallet = await dbModel.wallet.findOne({ _id: userid }).lean();
  const pow_div_curr = await balancesService.get_currmultiplier(currency);
  const balances = await balancesService.getWalletBalances(wallet.user_id);
  const balance = wallet ? balances[currencynw] : 0;

  let set = "";
  const updateNew = absAmount * pow_div_curr;

  if (parseFloat(updateAmount) >= 0) {
    if (data.args.transaction_uid) {
      set = {
        $inc: { [`${currencynw.toLowerCase()}_wallet.amount`]: updateNew },
      };
    } else {
      if (parseFloat(balance) >= parseFloat(absAmount)) {
        set = {
          $inc: { [`${currencynw.toLowerCase()}_wallet.amount`]: -updateNew },
        };
      } else {
        set = { [`${currencynw.toLowerCase()}_wallet.amount`]: 0 } ;
      }
    }
  } else {
    set = {
      $inc: { [`${currencynw.toLowerCase()}_wallet.amount`]: updateNew },
    };
  }

  wallet = await dbModel.wallet.findOneAndUpdate(
    {
      _id: userid,
    },
    set,
    { new: true }
  );
  const balancesnw = await balancesService.getWalletBalances(wallet.user_id);
  const userBalance = balancesnw[currencynw];

  io.emit("getBal", {
    balance: userBalance,
    address: tronAddr,
    currency: currencynw,
  });

  if (data.args.bet && !data.args.transaction_uid) {
    const tokenData = {
      userId: tronAddr,
      betAmount: betAmount,
      game_type: 2,
      currency: currencynw,
    };
    await common.ticketSystem(tokenData);
    await common.placeToken(tokenData);
  }

  if (data.args.win && winAmount>0) {
    console.log("booongowinmuiltipler");
    await common.slotwinmultipler(data.args.round_id);
  }
};

const updateShare = async (data, tronAddr, currency) => {
  const poolService = new PoolService();
  const divisett = await dbModel.dividendSettings.findOne();
  const slotSettings = await dbModel.slotSettings.findOne();
  const slotsBet = await dbModel.slots
    .findOne({ roundid: data.args.round_id, trntype: "BET" })
    .lean();
  const slotsWin = await dbModel.slots.find({
    roundid: data.args.round_id,
    trntype: "WIN",
  });
  let slotWinAmount = 0;
  const currencypass =
    currency == "mETH" ? "ETH" : currency == "MA1" ? "MATIC" : currency;

  for (let i = 0; i < slotsWin.length; i++) {
    slotWinAmount += +slotsWin[i].amount;
  }

  const slotBetAmount = slotsBet ? Math.abs(slotsBet.amount) : 0;
  const slotBetAmountNw =
    currency == "mETH" ? slotBetAmount / Math.pow(10, 3) : slotBetAmount;
  const slotWinAmountNw =
    currency == "mETH" ? slotWinAmount / Math.pow(10, 3) : slotWinAmount;
  const amountIncome = slotBetAmountNw - slotWinAmountNw;
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
    currencypass
  );
  io.emit("getdivi", { diviSettings: updatedSettings });
  const poolAmountKeysByCurrencyCode = poolService.getPoolAmountKeysByCurrencyCode(
    currencypass
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
