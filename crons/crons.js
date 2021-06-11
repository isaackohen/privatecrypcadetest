// todo - needs refactoring!!!
const Web3 = require("web3");
const cron = require("node-cron");
const getJSON = require("get-json");
const config = require("../config");
const mail = require("../helpers/mailHelper");
const common = require("../helpers/common");
const { dbModel } = require("../model/db");
const { matic, eth, trx } = require("../model/routes");
const MaticService = require("../services/matic");
const EthService = require("../services/eth");
const TrxService = require("../services/trx");
const currencyCodes = require("../constants/currencyCodes");

let depositCreation;
let ethDeposit;
let maticDeposit;
let coldWalletMoveDuringDepositTRX;
let coldWalletMoveDuringDepositETH;
let coldWalletMoveDuringDepositMATIC;
let limitReached;
let shareMoveToPlatipus;
// let cashBackRedeem;
let dailyReset;
let cashBack;
let circleRoundRemoval;
let withdrawExpire;
let dividendShareFromTRXPool;
let dividendShareFromETHPool;
let dividendShareFromMATICPool;
let sevendaystakeshare;
let fourteendaystakeshare;
let thirtydaystakeshare;
let stakeExpire;
let eurvalupdate;
let gamedisplayrandomizer;

const crons = {};
crons.start = () => {
  depositCreation.start();
  ethDeposit.start();
  maticDeposit.start();
  coldWalletMoveDuringDepositTRX.start();
  coldWalletMoveDuringDepositETH.start();
  coldWalletMoveDuringDepositMATIC.start();
  limitReached.start();
  shareMoveToPlatipus.start();
  // cashBackRedeem.start();
  dailyReset.start();
  cashBack.start();
  circleRoundRemoval.start();
  withdrawExpire.start();
  dividendShareFromTRXPool.start();
  dividendShareFromETHPool.start();
  dividendShareFromMATICPool.start();
  sevendaystakeshare.start();
  fourteendaystakeshare.start();
  thirtydaystakeshare.start();
  stakeExpire.start();
  eurvalupdate.start();
  gamedisplayrandomizer.start();
};
crons.init = (io) => {
  //TRX Cron Deposit
  depositCreation = cron.schedule(
    "*/3 * * * *",
    async () => {
      try {
        const trxService = new TrxService();
        await trxService.init();
        const events = await trxService.getEventResult("Deposit");

        events.map(async (event) => {
          const userId = trxService.fromHex(event.result.useraddr);
          const depositObj = {
            txnid: event.transaction,
            amount: event.result.amount,
            status: 1,
            currency: "TRX",
            userId: userId,
            linkedAddress: userId,
          };

          const depositExists = await dbModel.deposit
            .findOne({ txnid: depositObj.txnid })
            .lean();
          if (!depositExists) {
            await dbModel.deposit.create(depositObj);
            await trx.createWallet(userId, "TRX", depositObj.amount, io);
          }
        });
      } catch (error) {
        console.log("depositCreation error: ", error);
      }
    },
    {
      scheduled: false,
    }
  );

  //EUR value update cron 0 * * * *

  eurvalupdate = cron.schedule(
    "0 * * * *",
    async () => {
      getJSON(
        `https://api.coingecko.com/api/v3/simple/price?ids=tron&vs_currencies=eur`,
        async function (err, response) {
          if (err || !response) return;
          let trx_val = response.tron.eur;
          if (trx_val) {
            await dbModel.dividendSettings.updateOne(
              {},
              { $set: { trx_eur: trx_val } }
            );
          }
        }
      );

      getJSON(
        `https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=eur`,
        async function (err, response) {
          if (err || !response) return;
          let eth_val = response.ethereum.eur;
          if (eth_val) {
            await dbModel.dividendSettings.updateOne(
              {},
              { $set: { eth_eur: eth_val } }
            );
          }
        }
      );

      getJSON(
        `https://api.coingecko.com/api/v3/simple/price?ids=matic-network&vs_currencies=eur`,
        async function (err, response) {
          if (err || !response) return;
          let matic_val = response["matic-network"].eur;
          if (matic_val) {
            await dbModel.dividendSettings.updateOne(
              {},
              { $set: { matic_eur: matic_val } }
            );
          }
        }
      );
    },
    {
      scheduled: false,
    }
  );

     //Games Display update cron 0 * * * *

     gamedisplayrandomizer = cron.schedule(
      "0 0 0 * * *",
      async () => {
  
          let total_games = await dbModel.games.find().count();
          let rest_games = await dbModel.games.find({display_order:[9000, 8000]}).count();
          let needcount = parseInt(total_games) - parseInt(rest_games);
         
          let disp_upd = await dbModel.games.updateMany({ display_order : {$nin : [9000, 8000]}},{$set:{display_order:0}});
  
          if(disp_upd){
            let gam_data = await dbModel.games.aggregate([{$match:{display_order:0}},{$sample:{size:needcount}}]);
            let disp_order = needcount;
            if(gam_data){
              for (let i = 0; i < gam_data.length; i++){
                let updatedisporder = await dbModel.games.updateOne(
                            { _id: gam_data[i]._id },
                            { $set: { display_order: disp_order } }
                          );
                if(updatedisporder){
                     disp_order = disp_order - 1;
                 }
              }
            }
          }
       
      },
      {
        scheduled: false,
      }
    );
   

  // ETH cron deposit
  ethDeposit = cron.schedule(
    "*/3 * * * *",
    async () => {
      const siteDetails = await dbModel.siteSettings.findOne({}).lean();
      const address = config.eth.contract;
      const blockCount = siteDetails.ethblockcount;
      const startBlock =
        blockCount < 1000 ? 0 : siteDetails.ethblockcount - 1000;
      let blockCountUpd;
      let resBlockUpd = 0;
      if (!address) return;

      getJSON(
        `${config.eth.apiUrl}api?module=account&action=txlist&address=${address}&startblock=${startBlock}&endblock=latest&apikey=6QK27WMJNFSWJU5WX7399MAJCQSP2UT5Z8`,
        async function (err, response) {
          if (err || !response) return;
          const new_res = response.result;
          for (let i = 0; i < new_res.length; i++) {
            const web3 = new Web3(config.eth.provider);
            const address = web3.utils.toChecksumAddress(new_res[i].from);
            const wallet = await dbModel.wallet
              .findOne({ "eth_wallet.address": address })
              .lean();
            if (wallet) {
              const txn_exist = await dbModel.deposit
                .findOne({ txnid: new_res[i].hash, currency: "ETH" })
                .lean();
              if (!txn_exist && new_res[i].txreceipt_status === "1") {
                blockCountUpd = new_res[i].blockNumber;
                resBlockUpd = 1;
                const ins_data = {
                  userId: wallet.user_id,
                  linkedAddress: address,
                  currency: "ETH",
                  amount: new_res[i].value,
                  txnid: new_res[i].hash,
                  status: 1,
                };
                await dbModel.deposit.create(ins_data);
                await eth.updateWallet(
                  address,
                  "ETH",
                  new_res[i].value,
                  "credit",
                  io
                );
              }
            }
          }

          if (resBlockUpd === 1) {
            await dbModel.siteSettings.update(
              {},
              { $set: { ethblockcount: blockCountUpd } }
            );
          }
        }
      );
    },
    {
      scheduled: false,
    }
  );

  //cron for Matic Deposit
  maticDeposit = cron.schedule(
    "*/3 * * * *",
    async () => {
      const siteDetails = await dbModel.siteSettings.findOne({}).lean();
      const address = config.matic.contract;
      const blockCount = siteDetails.maticblockcount;
      const startBlock =
        blockCount < 1000 ? 0 : siteDetails.maticblockcount - 1000;
      let blockCountUpd;
      let resBlockUpd = 0;
      if (!address) return;
      getJSON(
        `${config.matic.apiUrl}api?module=account&action=txlist&address=${address}&startblock=${startBlock}&endblock=latest&apikey=6QK27WMJNFSWJU5WX7399MAJCQSP2UT5Z8`,
        async function (err, response) {
          if (err || !response) return;
          const new_res = response.result;
          for (let i = 0; i < new_res.length; i++) {
            const web3 = new Web3(config.eth.provider);
            const address = web3.utils.toChecksumAddress(new_res[i].from);
            const wallet = await dbModel.wallet
              .findOne({ "matic_wallet.address": address })
              .lean();
            if (wallet) {
              blockCountUpd = new_res[i].blockNumber;
              resBlockUpd = 1;
              const ins_data = {
                userId: wallet.user_id,
                linkedAddress: address,
                currency: "MATIC",
                amount: new_res[i].value,
                txnid: new_res[i].hash,
                status: 1,
              };

              const txn_exist = await dbModel.deposit
                .findOne({ txnid: new_res[i].hash, currency: "MATIC" })
                .lean();
              if (!txn_exist && new_res[i].txreceipt_status == "1") {
                await dbModel.deposit.create(ins_data);
                await matic.updateWallet(
                  address,
                  "MATIC",
                  new_res[i].value,
                  "credit",
                  io
                );
              }
            }
          }

          if (resBlockUpd === 1) {
            await dbModel.siteSettings.update(
              {},
              { $set: { maticblockcount: blockCountUpd } }
            );
          }
        }
      );
    },
    {
      scheduled: false,
    }
  );

  //cron for cold wallet move during deposit for TRX
  coldWalletMoveDuringDepositTRX = cron.schedule(
    "* * * * *",
    async () => {
      const siteDetails = await dbModel.siteSettings.findOne({}).lean();
      const withDetails = await dbModel.withdrawSetting.findOne({}).lean();
      const toAddress = siteDetails.admin_cold_wallet;
      const movePercentage = withDetails.move_percentage;

      let depAmt = 0;
      const deposit = await dbModel.deposit
        .find({
          userId: { $ne: toAddress },
          coldWalletStatus: 0,
          currency: "TRX",
        })
        .lean();

      if (!deposit || deposit.length <= 0) return;

      for (let i = 0; i < deposit.length; i++) {
        depAmt += +deposit[i].amount;
      }

      if (!depAmt) return;

      const amt = depAmt / 1000000;
      const toAmt = (+movePercentage / 100) * amt;
      const amount = Math.ceil(toAmt * 1000000);

      try {
        const trxService = new TrxService();
        await trxService.init();

        const contractBalance = await trxService.getBalance();
        if (contractBalance <= amount) return;

        const withdraw = await trxService.withdraw(amount, toAddress);
        const withdrawObj = {
          txnid: withdraw.transactionHash,
          amount: toAmt,
          status: 1,
          currency: "TRX",
          to_address: toAddress,
          available: amt,
        };
        await dbModel.adminTransaction.create(withdrawObj);
        await dbModel.deposit.update(
          { userId: { $ne: toAddress }, coldWalletStatus: 0, currency: "TRX" },
          { $set: { coldWalletStatus: 1 } }
        );
      } catch (error) {
        console.log("TRXCOLDWallet error: ", error);
      }
    },
    {
      scheduled: false,
    }
  );

  // cron for cold wallet move during deposit for ETH
  coldWalletMoveDuringDepositETH = cron.schedule(
    "0 0 */1 * * *",
    async () => {
      const withDetails = await dbModel.withdrawSetting.findOne({}).lean();
      const toAddress = config.eth.coldWallet;
      if (!toAddress) return;

      const movePercentage = withDetails.move_percentage;
      const powDivider = Math.pow(10, 18);

      let depAmt = 0;
      const deposit = await dbModel.deposit
        .find({
          linkedAddress: { $ne: toAddress },
          coldWalletStatus: 0,
          currency: "ETH",
        })
        .lean();

      if (!deposit || !deposit.length) return;

      for (let i = 0; i < deposit.length; i++) {
        depAmt += +deposit[i].amount;
      }

      if (!depAmt) return;

      const amt = depAmt / powDivider;
      const toAmt = (+movePercentage / 100) * amt;
      const amount = Math.ceil(toAmt * powDivider);

      const ethService = new EthService();

      try {
        const contractBalance = await ethService.getBalance();
        if (contractBalance <= amount) return;

        const withdraw = await ethService.withdraw(`${amount}`, toAddress);

        const withdrawObj = {
          txnid: withdraw.transactionHash,
          amount: toAmt,
          status: 1, // !withdraw.events.Withdraw.removed,
          currency: "ETH",
          to_address: toAddress,
          available: amt,
        };

        await dbModel.ethColdWallet.create(withdrawObj);
        await dbModel.deposit.update(
          {
            linkedAddress: { $ne: toAddress },
            coldWalletStatus: 0,
            currency: "ETH",
          },
          { $set: { coldWalletStatus: 1 } }
        );
      } catch (error) {
        console.log("ETHCOLDWallet error: ", error);
      }
    },
    {
      scheduled: false,
    }
  );

  //cron for cold wallet move during deposit for MATIC
  coldWalletMoveDuringDepositMATIC = cron.schedule(
    "* * * * *",
    async () => {
      const withDetails = await dbModel.withdrawSetting.findOne({}).lean();
      const toAddress = config.matic.coldwallet;
      if (!toAddress) return;

      const movePercentage = withDetails.move_percentage;
      const powDivider = Math.pow(10, 18);

      let depAmt = 0;
      const deposit = await dbModel.deposit
        .find({
          linkedAddress: { $ne: toAddress },
          coldWalletStatus: 0,
          currency: "MATIC",
        })
        .lean();

      if (!deposit || deposit.length <= 0) return;

      for (let i = 0; i < deposit.length; i++) {
        depAmt += +deposit[i].amount;
      }

      if (!depAmt) return;

      const amt = depAmt / powDivider;
      const toAmt = (movePercentage / 100) * amt;
      const toAmtt = parseInt(toAmt);
      const web3 = new Web3(config.eth.provider);
      const amount = web3.utils.toWei(toAmtt.toString());

      try {
        const maticService = new MaticService();

        const contractBalance = await maticService.getBalance();
        if (parseInt(contractBalance) <= parseInt(amount)) return;

        const withdraw = await maticService.withdraw(amount, toAddress);
        const withdrawObj = {
          txnid: withdraw.transactionHash,
          amount: toAmt,
          status: 1, // !withdraw.events.Withdraw.removed,
          currency: "MATIC",
          to_address: toAddress,
          available: amt,
        };

        await dbModel.ethColdWallet.create(withdrawObj);
        await dbModel.deposit.update(
          {
            linkedAddress: { $ne: toAddress },
            coldWalletStatus: 0,
            currency: "MATIC",
          },
          { $set: { coldWalletStatus: 1 } }
        );
      } catch (error) {
        console.log("MATICCOLDWallet error: ", error);
      }
    },
    {
      scheduled: false,
    }
  );

  // cron for contract limit reached
  limitReached = cron.schedule(
    "0 0 */1 * * *",
    async () => {
      const siteDetails = await dbModel.siteSettings.findOne({}).lean();
      const withDetails = await dbModel.withdrawSetting.findOne({}).lean();

      const platformLimit = +withDetails.platform_limit;
      const tdyRcdLimit = +withDetails.entire_tdywithdraw;

      if (platformLimit <= tdyRcdLimit) return;

      const rmgLimit = platformLimit - tdyRcdLimit;
      const perRcd = (75 / 100) * platformLimit;

      try {
        const trxService = new TrxService();
        await trxService.init();

        const pool = await trxService.getBalance();
        const poolAmt = pool / 1000000;

        if (perRcd < tdyRcdLimit && poolAmt < rmgLimit) {
          const emailTempData = await dbModel.emailTemplate.findOne({
            title: "withdraw_warning",
          });
          if (emailTempData) {
            const emailTempDataDynamic = emailTempData.mailcontent.replace(
              /###mail###/g,
              siteDetails.supportmail
            );
            mail.sendMail(
              {
                to: siteDetails.supportmail,
                subject: emailTempData.mailsubject,
                html: emailTempDataDynamic,
              },
              (mailRes) => {}
            );
          }
        }
      } catch (error) {
        console.log("limitReached error: ", error);
      }
    },
    {
      scheduled: false,
    }
  );

  //cron for share moving to platipus
  shareMoveToPlatipus = cron.schedule(
    "0 0 0 * * *",
    async () => {
      const slotDetails = await dbModel.slotSettings.findOne({}).lean();
      const to_address = slotDetails.platipus_share_address;
      let shareAmount = 0;
      const share = await dbModel.platiShare.aggregate([
        { $match: { status: 0 } },
        { $group: { _id: null, amount: { $sum: "$shared_amount" } } },
      ]);

      if (share[0] && share[0].amount) {
        shareAmount = +share[0].amount;
      }
      if (!shareAmount) return;

      try {
        const trxService = new TrxService();
        await trxService.init();

        const pool = await trxService.getBalance();
        const poolAmount = pool / 1000000;

        if (poolAmount <= shareAmount) return;

        const withdraw = await trxService.withdraw(
          shareAmount * 1000000,
          to_address
        );
        const withdrawObj = {
          txnid: withdraw.transactionHash,
          amount: shareAmount * 1000000,
          status: 1,
          currency: "TRX",
          userId: to_address,
        };

        await dbModel.platiWithdraw.create(withdrawObj);
        await dbModel.platiShare.updateMany(
          { status: 0 },
          { $set: { status: 1 } }
        );
      } catch (error) {
        console.log("shareMoveToPlatipus error: ", error);
      }
    },
    {
      scheduled: false,
    }
  );

  // //cron for cashback redeem move
  // cashBackRedeem = cron.schedule(
  //   "0 0 0 * * *",
  //   async () => {
  //     const d = new Date();
  //     const tdy_day = d.getDay();
  //     if (tdy_day === 5) {
  //       // cron for unused redeem to cashback_share
  //       console.log("cashback Redeem starts");
  //       const totalData = await dbModel.cashBack.aggregate([
  //         { $match: { expiryStatus: 1 } },
  //         { $group: { _id: null, amount: { $sum: "$redeem" } } },
  //       ]);
  //       if (totalData && totalData[0] && totalData[0].amount) {
  //         let shareAmount = Number(totalData[0].amount).toFixed(5);
  //         await dbModel.dividendSettings.updateOne(
  //           {},
  //           { $inc: { cashback_share: shareAmount } }
  //         );
  //         await dbModel.cashBack.update(
  //           { expiryStatus: 1 },
  //           { $set: { expiryStatus: 3 } },
  //           { multi: true }
  //         );
  //       }
  //
  //       //cashback redeem
  //       const cashbackData = await dbModel.cashBack.aggregate([
  //         { $match: { expiryStatus: 0 } },
  //         {
  //           $lookup: {
  //             from: "Users",
  //             localField: "userId",
  //             foreignField: "user_id",
  //             as: "user_info",
  //           },
  //         },
  //         {
  //           $unwind: "$user_info",
  //         },
  //       ]);
  //       cashbackData.forEach(async (doc) => {
  //         //according to user's rank need to multiply by percentage;
  //         const cashbackPer = common.rankIdentify(doc.user_info);
  //         doc.percentageAmount = cashbackPer;
  //         if (cashbackPer > 0) {
  //           doc.redeem =
  //             parseFloat(cashbackPer / 100) * parseFloat(doc.cashBackAmount);
  //           doc.expiryStatus = 1;
  //           doc.update_date = new Date();
  //           delete doc.user_info;
  //           await dbModel.cashBack.update({ _id: doc._id }, { $set: doc });
  //           console.log(doc, "doc for cashback");
  //         }
  //       });
  //       console.log("cashback Redeem Ends");
  //     }
  //   },
  //   {
  //     scheduled: false,
  //   }
  // );

  //cron for daily reset
  dailyReset = cron.schedule(
    "0 0 0 * * *",
    async () => {
      await dbModel.withdrawSetting.update(
        {},
        { $set: { entire_tdywithdraw: 0 } }
      );
      const userWith = await dbModel.users.find().lean();
      userWith.length &&
        (await dbModel.users.updateMany(
          {},
          { $set: { withdraw_count: 0, withdraw_amount: 0 } }
        ));
    },
    {
      scheduled: false,
    }
  );

  //every1hr cron for cashback
  cashBack = cron.schedule(
    "* * * * *",
    async () => {
      try {
        console.log("cashback cron");
      } catch (error) {
        console.log("cashBack error: ", error);
      }
    },
    {
      scheduled: false,
    }
  );

  //cron for circle round removal
  circleRoundRemoval = cron.schedule(
    "1 * * * *",
    async () => {
      const data = await dbModel.circleRound.find();
      for (let i = 0; i < data.length; i++) {
        const data1 = await dbModel.circle.findOne({
          roundId: data[i].roundId,
        });
        if (data1 === null) {
          await dbModel.circleRound.remove({ roundId: data[i].roundId });
        }
      }
    },
    {
      scheduled: false,
    }
  );

  //dividend withdraw expiry update for ETH, TRX, MATIC
  withdrawExpire = cron.schedule(
    "0 0 0 * * *",
    async () => {
      try {
        const diviDetails = await dbModel.dividendSettings.findOne({}).lean();
        const days = +diviDetails.withdraw_expiry;
        const lastWeek = new Date();
        lastWeek.setDate(lastWeek.getDate() - days);

        const dividends = await dbModel.dividendPool
          .find({ createddate: { $lte: lastWeek }, expiry_status: 0 })
          .lean();
        const sumEth = {
          [currencyCodes.ETH]: 0,
          [currencyCodes.TRX]: 0,
          [currencyCodes.MATIC]: 0,
        };

        dividends.map(async (dividend) => {
          await dbModel.dividendPool.updateOne(
            { _id: dividend._id },
            { $set: { expiry_status: 1 } }
          );
          sumEth[dividend.currency] += +dividend.distributed_amount;
        });

        await dbModel.dividendSettings.updateOne(
          {},
          {
            $set: {
              expiry_amount:
                sumEth[currencyCodes.TRX] + +diviDetails.expiryeth_amount ||
                0.0,
              expirymatic_amount:
                sumEth[currencyCodes.MATIC] + +diviDetails.expiryeth_amount ||
                0.0,
              expiryeth_amount:
                sumEth[currencyCodes.ETH] + +diviDetails.expiryeth_amount ||
                0.0,
            },
          }
        );
      } catch (error) {
        console.log("withdrawExpire error: ", error);
      }
    },
    {
      scheduled: false,
    }
  );

  //stake profit withdraw expiry update
  stakeExpire = cron.schedule(
    "0 0 0 * * *",
    async () => {
      try {
        const diviDetails = await dbModel.dividendSettings.findOne({}).lean();
        const days = 30;
        const lastWeek = new Date();
        lastWeek.setDate(lastWeek.getDate() - days);
        let exp_amount = 0;

        const stakedata = await dbModel.stakeprofit
          .find({ createddate: { $lte: lastWeek }, expiry_status: 0 })
          .lean();
        let sum = 0;

        for (i = 0; i < stakedata.length; i++) {
          let updatestake = await dbModel.stakeprofit.updateOne(
            { _id: stakedata[i]._id },
            { $set: { expiry_status: 1 } }
          );
          sum = parseFloat(sum) + parseFloat(stakedata[i].profit);
        }

        exp_amount =
          parseFloat(sum) + parseFloat(diviDetails.expirystake_amount);
        exp_amount = exp_amount > 0 ? exp_amount : 0.0;

        let exp_bal = await dbModel.dividendSettings.updateOne(
          {},
          { $set: { expirystake_amount: exp_amount } }
        );
      } catch (error) {
        console.log("stakeExpire error: ", error);
      }
    },
    {
      scheduled: false,
    }
  );

  //dividend share from TRX Pool
  dividendShareFromTRXPool = cron.schedule(
    "0 0 0 * * *",
    async () => {
      try {
        const settings = await dbModel.dividendSettings.findOne().lean();
        const userData = await dbModel.tokenMining.find();
        let userBalance = 0;
        let adminCalculatedAmount = 0;
        let teamCalculatedAmount = 0;
        let totalToken = 0;
        const d = new Date();
        let winner_share = 0;
        let wager_share = 0;

        const tdy_day = d.getDay();

        if (settings.fake_pool_amount > 0) {
          console.log("TRX Dividend Share starts");
          const initial_amount = settings.fake_pool_amount;
          if (userData) {
            for (let i = 0; i < userData.length; i++) {
              if (
                userData[i].Cad_token[3].type === "unfreeze" &&
                userData[i].Cad_token[3].amount
              ) {
                totalToken += +userData[i].Cad_token[3].amount;
              }
            }
          }

          // user dividend share
          if (settings.user_percent > 0) {
            for (let i = 0; i < userData.length; i++) {
              if (
                userData[i].Cad_token[3].type === "unfreeze" &&
                userData[i].Cad_token[3].amount
              ) {
                const poolData = await dbModel.users
                  .findOne({ user_id: userData[i].userId })
                  .lean();
                if (poolData) {
                  const calculatedAmount =
                    (+userData[i].Cad_token[3].amount / totalToken) *
                    (+settings.user_percent / 100) *
                    +settings.fake_pool_amount;
                  userBalance += calculatedAmount;

                  const insertObj = {
                    userId: userData[i].userId,
                    freezed_tokens: userData[i].Cad_token[3].amount,
                    distributed_amount: calculatedAmount,
                    currency: "TRX",
                  };

                  await dbModel.dividendPool.create(insertObj);
                }
              }
            }
          }

          //admin dividend share
          if (settings.admin_percent > 0) {
            adminCalculatedAmount =
              (settings.admin_percent / 100) * settings.fake_pool_amount;
            const updated_admin_amt =
              adminCalculatedAmount + +settings.admin_amount;
            const admin_upd = updated_admin_amt.toFixed(5);
            await dbModel.dividendSettings.updateOne(
              {},
              { $set: { admin_amount: admin_upd } }
            );
          }

          //team dividend share
          if (settings.team_percent > 0) {
            teamCalculatedAmount =
              (settings.team_percent / 100) * settings.fake_pool_amount;
            const updated_team_amt =
              teamCalculatedAmount + settings.team_amount;
            const team_upd = updated_team_amt.toFixed(5);
            await dbModel.dividendSettings.updateOne(
              {},
              { $set: { team_amount: team_upd } }
            );
          }

          var wageAmt =
            0.015 * parseFloat(userBalance) +
            parseFloat(settings.wager_pool_amount);
          var winAmt =
            0.0075 * parseFloat(userBalance) +
            parseFloat(settings.winner_pool_amount);
          const finalAmount =
            userBalance + adminCalculatedAmount + teamCalculatedAmount;
          const finalCalAmt = +initial_amount - finalAmount;
          const finalAmt = +settings.pool_amount - finalAmount;

          let finalAmtUpd = finalAmt.toFixed(5);
          let finalCalUpd = finalCalAmt.toFixed(5);
          var wageAmountUpd = wageAmt.toFixed(5);
          var winAmountUpd = winAmt.toFixed(5);

          //wager share

          if (tdy_day === 5) {
            const data = await common.Wagerslotdata("cron");
            if (
              data.wagerData &&
              data.wagerData.length > 0 &&
              data.winnerData &&
              data.winnerData.length > 0
            ) {
              data.wagerData.map(async (items) => {
                const data = {
                  userId: items.wallet_docs.user_id,
                  type: "Wager",
                  amount: items.prize,
                  currency: "TRX",
                };
                await dbModel.battleShare.create(data);
                await dbModel.wallet.update(
                  { user_id: items.wallet_docs.user_id },
                  { $inc: { "trx_wallet.amount": items.prize * 1000000 } }
                );
              });
              data.winnerData.map(async (items) => {
                const data = {
                  userId: items.wallet_docs.user_id,
                  type: "Winner",
                  amount: items.prize,
                  currency: "TRX",
                };
                await dbModel.battleShare.create(data);
                await dbModel.wallet.update(
                  { user_id: items.wallet_docs.user_id },
                  { $inc: { "trx_wallet.amount": items.prize * 1000000 } }
                );
              });
              winner_share = winAmountUpd;
              wager_share = wageAmountUpd;
              const poolFinalAmtUpd =
                +settings.wager_pool_amount +
                +settings.winner_pool_amount +
                finalAmount;
              finalCalUpd = (
                +settings.fake_pool_amount - poolFinalAmtUpd
              ).toFixed(5);
              finalAmtUpd = (+settings.pool_amount - poolFinalAmtUpd).toFixed(
                5
              );
            }
          }

          console.log("wager_pool_update", wageAmountUpd);
          console.log("winner_pool_update", winAmountUpd);

          await dbModel.dividendSettings.updateOne(
            {},
            {
              $set: {
                pool_amount: finalAmtUpd,
                fake_pool_amount: finalCalUpd,
                wager_pool_amount: wageAmountUpd,
                winner_pool_amount: winAmountUpd,
              },
            }
          );
          const earningObj = {
            initial_amount: initial_amount,
            user_share: userBalance,
            admin_share: adminCalculatedAmount,
            winner_share: winner_share,
            wager_share: wager_share,
            team_share: teamCalculatedAmount,
            user_percent: settings.user_percent,
            admin_percent: settings.admin_percent,
            team_percent: settings.team_percent,
            final_amount: finalCalAmt,
            currency: "TRX",
          };

          await dbModel.earningTab.create(earningObj);
          console.log("trx dividend share occured");
        }
      } catch (error) {
        console.log("dividendShareFromTRXPool error: ", error);
      }
    },
    {
      scheduled: false,
    }
  );

  dividendShareFromETHPool = cron.schedule(
    "0 0 0 * * *",
    async () => {
      try {
        const settings = await dbModel.dividendSettings.findOne().lean();
        const userData = await dbModel.tokenMining.find();
        let userBalance = 0;
        let adminCalculatedAmount = 0;
        let teamCalculatedAmount = 0;
        let totalToken = 0;
        let winner_share = 0;
        let wager_share = 0;

        if (settings.eth_fake_pool_amount > 0) {
          console.log("eth dividend share starts");
          const initial_amount = settings.eth_fake_pool_amount;
          if (userData) {
            for (let i = 0; i < userData.length; i++) {
              if (
                userData[i].Cad_token[3].type === "unfreeze" &&
                userData[i].Cad_token[3].amount
              ) {
                totalToken += +userData[i].Cad_token[3].amount;
              }
            }
          }

          // user dividend share
          if (settings.user_percent > 0) {
            for (let i = 0; i < userData.length; i++) {
              if (
                userData[i].Cad_token[3].type === "unfreeze" &&
                userData[i].Cad_token[3].amount
              ) {
                const poolData = await dbModel.users
                  .findOne({ user_id: userData[i].userId })
                  .lean();
                if (poolData) {
                  const calculatedAmount =
                    (+userData[i].Cad_token[3].amount / totalToken) *
                    (+settings.user_percent / 100) *
                    +settings.eth_fake_pool_amount;
                  userBalance += calculatedAmount;

                  const insertObj = {
                    userId: userData[i].userId,
                    freezed_tokens: userData[i].Cad_token[3].amount,
                    distributed_amount: calculatedAmount,
                    currency: "ETH",
                  };

                  await dbModel.dividendPool.create(insertObj);
                }
              }
            }
          }

          //admin dividend share
          if (settings.admin_percent > 0) {
            const adminCalculatedAmount =
              (settings.admin_percent / 100) * settings.eth_fake_pool_amount;
            const updated_admin_amt =
              adminCalculatedAmount + +settings.admin_amount_eth;
            const admin_upd = updated_admin_amt.toFixed(5);
            await dbModel.dividendSettings.updateOne(
              {},
              { $set: { admin_amount_eth: admin_upd } }
            );
          }

          //team dividend share
          if (settings.team_percent > 0) {
            const teamCalculatedAmount =
              (settings.team_percent / 100) * settings.eth_fake_pool_amount;
            const updated_team_amt =
              teamCalculatedAmount + settings.team_amount_eth;
            const team_upd = updated_team_amt.toFixed(5);
            await dbModel.dividendSettings.updateOne(
              {},
              { $set: { team_amount_eth: team_upd } }
            );
          }

          const finalAmount =
            userBalance + adminCalculatedAmount + teamCalculatedAmount;
          const finalCalAmt = +initial_amount - finalAmount;
          const finalAmt = +settings.eth_pool_amount - finalAmount;

          let finalAmtUpd = finalAmt.toFixed(5);
          let finalCalUpd = finalCalAmt.toFixed(5);

          //wager share

          await dbModel.dividendSettings.updateOne(
            {},
            {
              $set: {
                eth_pool_amount: finalAmtUpd,
                eth_fake_pool_amount: finalCalUpd,
              },
            }
          );
          const earningObj = {
            initial_amount: initial_amount,
            user_share: userBalance,
            admin_share: adminCalculatedAmount,
            winner_share: winner_share,
            wager_share: wager_share,
            team_share: teamCalculatedAmount,
            user_percent: settings.user_percent,
            admin_percent: settings.admin_percent,
            team_percent: settings.team_percent,
            final_amount: finalCalAmt,
            currency: "ETH",
          };

          await dbModel.earningTab.create(earningObj);
          console.log("eth dividend share occured");
        }
      } catch (error) {
        console.log("dividendShareFromETHPool error: ", error);
      }
    },
    {
      scheduled: false,
    }
  );

  //dividend share from MATIC Pool
  dividendShareFromMATICPool = cron.schedule(
    "0 0 0 * * *",
    async () => {
      try {
        const settings = await dbModel.dividendSettings.findOne().lean();
        const userData = await dbModel.tokenMining.find();
        let userBalance = 0;
        let adminCalculatedAmount = 0;
        let teamCalculatedAmount = 0;
        let totalToken = 0;
        let winner_share = 0;
        let wager_share = 0;

        if (settings.matic_fake_pool_amount > 0) {
          console.log("matic dividend share starts");
          const initial_amount = settings.matic_fake_pool_amount;
          if (userData) {
            for (let i = 0; i < userData.length; i++) {
              if (
                userData[i].Cad_token[3].type === "unfreeze" &&
                userData[i].Cad_token[3].amount
              ) {
                totalToken += +userData[i].Cad_token[3].amount;
              }
            }
          }

          // user dividend share
          if (settings.user_percent > 0) {
            for (let i = 0; i < userData.length; i++) {
              if (
                userData[i].Cad_token[3].type === "unfreeze" &&
                userData[i].Cad_token[3].amount
              ) {
                const poolData = await dbModel.users
                  .findOne({ user_id: userData[i].userId })
                  .lean();
                if (poolData) {
                  const calculatedAmount =
                    (+userData[i].Cad_token[3].amount / totalToken) *
                    (+settings.user_percent / 100) *
                    +settings.matic_fake_pool_amount;
                  userBalance += calculatedAmount;

                  const insertObj = {
                    userId: userData[i].userId,
                    freezed_tokens: userData[i].Cad_token[3].amount,
                    distributed_amount: calculatedAmount,
                    currency: "MATIC",
                  };

                  await dbModel.dividendPool.create(insertObj);
                }
              }
            }
          }

          //admin dividend share
          if (settings.admin_percent > 0) {
            adminCalculatedAmount =
              (settings.admin_percent / 100) * settings.matic_fake_pool_amount;
            const updated_admin_amt =
              adminCalculatedAmount + +settings.admin_amount_matic;
            const admin_upd = updated_admin_amt.toFixed(5);
            await dbModel.dividendSettings.updateOne(
              {},
              { $set: { admin_amount_matic: admin_upd } }
            );
          }

          //team dividend share
          if (settings.team_percent > 0) {
            teamCalculatedAmount =
              (settings.team_percent / 100) * settings.matic_fake_pool_amount;
            const updated_team_amt =
              teamCalculatedAmount + settings.team_amount_matic;
            const team_upd = updated_team_amt.toFixed(5);
            await dbModel.dividendSettings.updateOne(
              {},
              { $set: { team_amount_matic: team_upd } }
            );
          }

          const finalAmount =
            userBalance + adminCalculatedAmount + teamCalculatedAmount;
          const finalCalAmt = +initial_amount - finalAmount;
          const finalAmt = +settings.matic_pool_amount - finalAmount;

          let finalAmtUpd = finalAmt.toFixed(5);
          let finalCalUpd = finalCalAmt.toFixed(5);

          //wager share

          await dbModel.dividendSettings.updateOne(
            {},
            {
              $set: {
                matic_pool_amount: finalAmtUpd,
                matic_fake_pool_amount: finalCalUpd,
              },
            }
          );
          const earningObj = {
            initial_amount: initial_amount,
            user_share: userBalance,
            admin_share: adminCalculatedAmount,
            winner_share: winner_share,
            wager_share: wager_share,
            team_share: teamCalculatedAmount,
            user_percent: settings.user_percent,
            admin_percent: settings.admin_percent,
            team_percent: settings.team_percent,
            final_amount: finalCalAmt,
            currency: "MATIC",
          };

          await dbModel.earningTab.create(earningObj);
          console.log("matic dividend share occured");
        }
      } catch (error) {
        console.log("dividendShareFromMATICPool error: ", error);
      }
    },
    {
      scheduled: false,
    }
  );

  sevendaystakeshare = cron.schedule(
    "0 9 * * MON,WED",
    async () => {
      try {
        const lastWeek = new Date();
        lastWeek.setDate(lastWeek.getDate() - 7);

        const stake_data = await dbModel.staking
          .find({ createdDate: { $lte: lastWeek }, status: 0, periods: 7 })
          .lean();

        if (stake_data && stake_data.length > 0) {
          stake_data.forEach(async (doc) => {
            if (doc.autoOption == 0) {
              const auto = common.normalauto(doc);
            } else if (doc.autoOption == 1) {
              const auto = common.reinvestauto(doc);
            } else {
              const auto = common.compoundauto(doc);
            }
          });
        } else {
          console.log("sevendaystakenotavailable");
        }
      } catch (error) {
        console.log("stackshare error: ", error);
      }
    },
    {
      scheduled: false,
    }
  );

  fourteendaystakeshare = cron.schedule(
    "0 9 * * MON,WED",
    async () => {
      try {
        const lastWeek = new Date();
        lastWeek.setDate(lastWeek.getDate() - 14);

        const stake_data = await dbModel.staking
          .find({ createdDate: { $lte: lastWeek }, status: 0, periods: 14 })
          .lean();

        if (stake_data && stake_data.length > 0) {
          stake_data.forEach(async (doc) => {
            if (doc.autoOption == 0) {
              const auto = common.normalauto(doc);
            } else if (doc.autoOption == 1) {
              const auto = common.reinvestauto(doc);
            } else {
              const auto = common.compoundauto(doc);
            }
          });
        } else {
          console.log("fourteendaystaksharenotavailable");
        }
      } catch (error) {
        console.log("stackshare error: ", error);
      }
    },
    {
      scheduled: false,
    }
  );

  thirtydaystakeshare = cron.schedule(
    "0 9 * * MON,WED",
    async () => {
      try {
        const lastWeek = new Date();
        lastWeek.setDate(lastWeek.getDate() - 30);

        const stake_data = await dbModel.staking
          .find({ createdDate: { $lte: lastWeek }, status: 0, periods: 30 })
          .lean();

        if (stake_data && stake_data.length > 0) {
          stake_data.forEach(async (doc) => {
            if (doc.autoOption == 0) {
              const auto = common.normalauto(doc);
            } else if (doc.autoOption == 1) {
              const auto = common.reinvestauto(doc);
            } else {
              const auto = common.compoundauto(doc);
            }
          });
        } else {
          console.log("thirtydaystakesharenotavailable");
        }
      } catch (error) {
        console.log("stackshare error: ", error);
      }
    },
    {
      scheduled: false,
    }
  );
};

module.exports = crons;
