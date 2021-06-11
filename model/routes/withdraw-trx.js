const sleep = require("await-sleep");
const common = require("../../helpers/common");
const mail = require("../../helpers/mailHelper");
const { dbModel } = require("../db");
const {
  getFrequentWithdrawal,
  setFrequentWithdrawal,
} = require("../../helpers/redis");
const { doRecaptcha } = require("../../helpers/captcha");
const TrxService = require("../../services/trx");

const createWallet = async (user_id, currency, amount, io) => {
  const wallet = await dbModel.wallet.findOne({ user_id: user_id });
  if (wallet) {
    await dbModel.wallet.rem;
    await updateWallet(user_id, currency, amount, "credit", io);
    return;
  }

  const newWallet = {
    user_id,
    trx_wallet: { currency, amount, address: user_id },
    eth_wallet: { currency: "ETH", amount: 0, address: "" },
    matic_wallet: { currency: "MATIC", amount: 0, address: "" },
  };
  const created = await dbModel.wallet.create(newWallet);

  if (created) {
    const wallet = await dbModel.wallet.findOne({ user_id: user_id });
    const balance = wallet.trx_wallet.amount / 1000000;
    const address = wallet.trx_wallet.address;
    io && io.emit("getBal", { balance, address, currency });
  }
};

const updateWallet = async (user_id, currency, depositedAmount, type, io) => {
  try {
    let wallet = await dbModel.wallet.findOne({ user_id: user_id }).lean();
    if (!wallet) return;

    const userBalance = wallet.trx_wallet.amount
      ? wallet.trx_wallet.amount / 1000000
      : 0;

    let setAmount;
    if (type === "credit") {
      setAmount = { $inc: { "trx_wallet.amount": depositedAmount } };
    } else {
      setAmount =
        userBalance > 0
          ? { $inc: { "trx_wallet.amount": -depositedAmount } }
          : {};
    }

    wallet = await dbModel.wallet
      .findOneAndUpdate({ user_id: user_id }, setAmount, { new: true })
      .lean();
    const balance = wallet.trx_wallet.amount / 1000000;
    const address = wallet.trx_wallet.address;
    io && io.emit("getBal", { balance, address, currency });

    return true;
  } catch (error) {
    console.log("updateWallet", error);
    return false;
  }
};

const withdraw = async (req, io) => {
  const status = false;

  try {
    const data = req.body;
    if (!data.recaptcha) {
      return { status, error: "Please select captcha" };
    }

    const ip = (
      req.header("x-forwarded-for") || req.connection.remoteAddress
    ).replace("::ffff:", "");

    if (!(await doRecaptcha(data.recaptcha, ip))) {
      return { status, error: "Please fill in the correct captcha" };
    }

    const siteDetails = await dbModel.siteSettings.findOne({}).lean();

    if (await getFrequentWithdrawal(req.genuserId, "TRX")) {
      let emailTemplateData = await dbModel.emailTemplate.findOne({
        title: "withdraw_user_warning",
      });

      if (emailTemplateData) {
        const emailTemplateDataDynamic = emailTemplateData.mailcontent
          .replace(/###mail###/g, siteDetails.supportmail)
          .replace(/###ADDRESS###/g, req.genuserId);
        mail.sendMail(
          {
            to: siteDetails.supportmail,
            subject: emailTemplateData.mailsubject,
            html: emailTemplateDataDynamic,
          },
          function (mailRes) {}
        );
      }

      return {
        status,
        error: "Frequent withdrawal. Please try again in 15 minutes.",
      };
    }
    await setFrequentWithdrawal(req.genuserId, "TRX"); // todo - maybe set it after withdraw successful

    if (!+data.withdrawAmount || +data.withdrawAmount <= 0) {
      return { status, error: "Invalid Amount" };
    }

    const withdrawSett = await dbModel.withdrawSetting.findOne({}).lean();
    if (withdrawSett.withdraw_enable === "1") {
      // todo strange ?!
      return {
        status,
        error: "Currently Withdraw Disabled. Try After Some time.",
      };
    }

    const userData = await dbModel.userManagement.findOne({
      user_address: req.genuserId,
      status: 0,
    });
    if (userData) {
      return { status, error: "You are Blocked" };
    }

    const userSett = await dbModel.users
      .findOne({ user_id: req.genuserId })
      .lean();
    const wallet = await dbModel.wallet
      .findOne({ user_id: req.genuserId })
      .lean();
    const balance = +wallet.trx_wallet.amount / Math.pow(10, 6);

    const balanceWithdraw =
      parseFloat(userSett.withdraw_amount) + parseFloat(data.withdrawAmount);
    const todyWithdraw =
      parseFloat(withdrawSett.user_amountlimit) -
      parseFloat(userSett.withdraw_amount);
    const platWithdrawLimit =
      parseFloat(withdrawSett.platform_limit) -
      parseFloat(withdrawSett.entire_tdywithdraw);

    if (parseFloat(data.withdrawAmount) > balance) {
      return {
        status,
        error: "Your wallet doesn't have that much balance to withdraw",
      };
    }

    if (
      parseFloat(data.withdrawAmount) <
      parseFloat(withdrawSett.min_withdrawAmount)
    ) {
      return {
        status,
        error:
          "Withdraw amount should be greater than or equal to the minimum allowed",
      };
    }

    if (
      parseFloat(data.withdrawAmount) >
      parseFloat(withdrawSett.max_withdrawAmount)
    ) {
      return {
        status,
        error: "Withdraw amount should be smaller than the maximum allowed",
      };
    }

    if (parseFloat(data.withdrawAmount) > platWithdrawLimit) {
      return {
        status,
        error: "Platform Withdraw Limit Reached. Try after some time",
      };
    }

    if (
      parseFloat(userSett.withdraw_count) >=
        parseFloat(withdrawSett.user_countlimit) ||
      balanceWithdraw > parseFloat(withdrawSett.user_amountlimit)
    ) {
      return {
        status,
        error: "You have reached the maximum withdrawal limit for today",
      };
    }

    const trxService = new TrxService();
    await trxService.init();

    const pool = await trxService.getBalance();
    const poolAmount = pool / 1000000;

    const contractWithdrawLimit = await trxService.getWithdrawLimit();
    const limitAmount = Number(contractWithdrawLimit._hex) / 1000000;

    if (parseFloat(data.withdrawAmount) > poolAmount) {
      const emailTemplateData = await dbModel.emailTemplate.findOne({
        title: "withdraw_warning",
      });
      if (emailTemplateData) {
        const emailTemplateDataDynamic = emailTemplateData.mailcontent.replace(
          /###mail###/g,
          siteDetails.supportmail
        );
        mail.sendMail(
          {
            to: siteDetails.supportmail,
            subject: emailTemplateData.mailsubject,
            html: emailTemplateDataDynamic,
          },
          function (mailRes) {}
        );
      }
      return { status, error: "Transaction Failed." }; // there is not enough TRX in contract
    }

    if (parseFloat(data.withdrawAmount) > limitAmount) {
      return { status, error: "Contract withdraw limit exceeded." };
    }

    await updateWallet(
      req.genuserId,
      "TRX",
      data.withdrawAmount * 1000000,
      "debit",
      io
    );
    const withdraw = await trxService.withdraw(
      data.withdrawAmount * 1000000,
      req.genuserId
    );
    if (withdraw.txnid) {
      const withdrawObj = {
        ip,
        txnid: withdraw.txnid,
        amount: data.withdrawAmount * 1000000,
        status: 1,
        currency: "TRX",
        userId: req.genuserId,
        linkedAddress: req.genuserId,
      };
      dbModel.withdraw.create(withdrawObj);
      const withdraw_count = parseFloat(userSett.withdraw_count) + 1;
      const withdraw_amount =
        parseFloat(userSett.withdraw_amount) + parseFloat(data.withdrawAmount);
      const today_withdraw =
        parseFloat(withdrawSett.entire_tdywithdraw) +
        parseFloat(data.withdrawAmount);
      await dbModel.users.updateOne(
        { user_id: req.genuserId },
        { $set: { withdraw_count, withdraw_amount } }
      );
      await dbModel.withdrawSetting.updateOne(
        {},
        { $set: { entire_tdywithdraw: today_withdraw } }
      );

      return { status: true, msg: "Withdraw Completed Successfully" };
    } else {
      await updateWallet(
        req.genuserId,
        "TRX",
        data.withdrawAmount * 1000000,
        "credit",
        io
      );
      return { status, error: "Transaction Failed" };
    }
  } catch (error) {
    console.log("withdraw TRX", error);
    return { status, error: "Transaction Failed." };
  }
};

const claim = async (req, io) => {
  const status = false;
  try {
    const ip = (
      req.header("x-forwarded-for") || req.connection.remoteAddress
    ).replace("::ffff:", "");
    const data = req.body;
    if (!data.claimAmount || data.claimAmount <= 0) {
      return { status, error: "Invalid Amount" };
    }

    const wallet = await dbModel.wallet
      .findOne({ user_id: req.genuserId })
      .lean();
    const bal = wallet.trx_wallet.amount / 1000000;
    const dividendSettings = await dbModel.dividendSettings.findOne({}).lean();
    const claimFeeAmount = dividendSettings.claim_fee_amount;

    if (bal < parseFloat(claimFeeAmount)) {
      return { status, error: "Insufficent Balance" };
    }

    const tokenMining = await dbModel.tokenMining
      .findOne({ userId: req.genuserId })
      .lean();
    if (
      !tokenMining ||
      tokenMining.Cad_token[0].type !== "claim" ||
      !tokenMining.Cad_token[0].amount ||
      parseInt(tokenMining.Cad_token[0].amount) !== data.claimAmount
    ) {
      return { status, error: "No CADE available to claim" };
    }

    const siteDetails = await dbModel.siteSettings.findOne({}).lean();
    const claimTab = await dbModel.claimTab
      .find({
        userId: req.genuserId,
        createddate: { $gt: new Date(Date.now() - 1000 * 60 * 10) },
      })
      .count();
    if (claimTab) {
      return { status, error: "Try Claim After 10 mins" };
    }

    const userData = await dbModel.userManagement.findOne({
      user_address: req.genuserId,
      status: 0,
    });
    if (userData) {
      return { status, error: "You are Blocked" };
    }

    const passValue = parseInt(data.claimAmount);
    const destinationBalance = passValue + "000000000000000000";

    const tronLink = await common.tronMintLink();
    const contract = await tronLink.contract().at(siteDetails.contractAddress);
    await dbModel.tokenMining.updateOne(
      { userId: req.genuserId, "Cad_token.type": "claim" },
      { $set: { "Cad_token.$.amount": 0 } }
    );
    const response = await contract
      .minterTransfer(req.genuserId, destinationBalance)
      .send();
    await sleep(4000);

    const transactionInfo = await tronLink.trx.getTransaction(response);
    const txStatus = transactionInfo.ret[0].contractRet; // SUCCESS or REVERT

    if (txStatus === "SUCCESS") {
      const upd_amt =
        parseFloat(dividendSettings.mint_amount) + parseFloat(claimFeeAmount);
      await updateWallet(
        req.genuserId,
        "TRX",
        claimFeeAmount * 1000000,
        "debit",
        io
      );
      await dbModel.betCount.updateOne(
        { userId: req.genuserId },
        { $set: { betAmount: 0 } }
      );
      await dbModel.dividendSettings.updateOne(
        {},
        { $set: { mint_amount: upd_amt } }
      );

      const claimObj = {
        ip,
        txnid: response.transactionHash,
        amount: data.claimAmount,
        status: 1,
        currency: "CADE",
        userId: req.genuserId,
      };
      await dbModel.claimTab.create(claimObj);
      await common.update_token(req);

      return { status: true, msg: "Claimed Token Successfully" };
    } else {
      const claimObj = {
        ip,
        txnid: response.transactionHash,
        amount: data.claimAmount,
        status: 0,
        currency: "CADE",
        userId: req.genuserId,
      };
      await dbModel.claimTab.create(claimObj);
      await dbModel.tokenMining.updateOne(
        {
          userId: req.genuserId,
          "Cad_token.type": "claim",
        },
        { $set: { "Cad_token.$.amount": data.claimAmount } }
      );

      return { status, error: "Failed to Claim" };
    }
  } catch (error) {
    console.log("Claim", error);
    return { status, error: "An error occurred" };
  }
};

const redeem = async (req, io) => {
  const status = false;
  const data = req.body;
  try {
    const totalData = await dbModel.dividendPool.aggregate([
      { $match: { userId: req.genuserId, expiry_status: 0, currency: "TRX" } },
      { $group: { _id: null, amount: { $sum: "$distributed_amount" } } },
    ]);

    if (!+data.withdrawAmount || data.withdrawAmount <= 0) {
      return { status, error: "Invalid Amount" };
    }

    const userData = await dbModel.userManagement.findOne({
      user_address: req.genuserId,
      status: 0,
    });
    if (userData) {
      return { status, error: "You are Blocked" };
    }

    const newAmount =
      totalData[0] && totalData[0].amount
        ? Number(totalData[0].amount).toFixed(5)
        : 0;
    if (parseFloat(data.withdrawAmount) > parseFloat(newAmount)) {
      return { status, error: "Insufficent balance" };
    }

    const withdrawdiviObj = {
      amount: data.withdrawAmount * 1000000,
      status: 1,
      currency: "TRX",
      userId: req.genuserId,
    };
    await dbModel.withdrawDividend.create(withdrawdiviObj);

    if (
      await updateWallet(
        req.genuserId,
        "TRX",
        data.withdrawAmount * 1000000,
        "credit",
        io
      )
    ) {
      await dbModel.dividendPool.updateMany(
        { userId: req.genuserId, expiry_status: 0, currency: "TRX" },
        { $set: { expiry_status: 1 } }
      );
    }

    return { status: true, msg: "Redeem Completed Successfully" };
  } catch (error) {
    console.log("withdraw", error);
    return { status, error: "An error occurred" };
  }
};

const redeemCashback = async (req, io) => {
  const data = req.body;
  const status = false;
  try {
    const getCashbackTbl = await dbModel.cashBack
      .findOne({ userId: req.genuserId, expiryStatus: 1 })
      .lean();
    if (
      !+data.redeem ||
      +data.redeem < 0 ||
      data.redeem !== getCashbackTbl.redeem.toFixed(5)
    ) {
      return { status, error: "Invalid Amount" };
    }

    const diviSettUpdate = await dbModel.dividendSettings.updateOne(
      {},
      { $inc: { pool_amount: -data.redeem, fake_pool_amount: -data.redeem } }
    );
    if (!diviSettUpdate) {
      return { status, error: "An error occured." };
    }

    await updateWallet(
      req.genuserId,
      "TRX",
      data.redeem * 1000000,
      "credit",
      io
    );
    await dbModel.cashBack.update(
      { userId: req.genuserId, expiryStatus: 1 },
      { $set: { expiryStatus: 2 } }
    );

    return { status: true, msg: "Redeem Completed Successfully" };
  } catch (error) {
    console.log("moveRedeemCashback", error);
    return { status, error: "An error occurred" };
  }
};

const moveReference = async (req, io) => {
  const data = req.body;
  const status = false;

  try {
    const totalData = await dbModel.gaugeShare.aggregate([
      { $match: { ruserId: req.genuserId, status: 0, currency: "TRX" } },
      { $group: { _id: null, amount: { $sum: "$received_amount" } } },
    ]);
    if (!+data.withdrawAmount || data.withdrawAmount <= 0) {
      return { status, error: "Invalid Amount" };
    }

    const userData = await dbModel.userManagement.findOne({
      user_address: req.genuserId,
      status: 0,
    });
    if (userData) {
      return { status, error: "You are Blocked" };
    }

    const newAmount =
      totalData[0] && totalData[0].amount ? +totalData[0].amount.toFixed(5) : 0;

    if (+data.withdrawAmount > +newAmount) {
      return { status, error: "Insufficient balance" };
    }

    const withdrawRefObj = {
      amount: data.withdrawAmount * 1000000,
      status: 1,
      currency: "TRX",
      userId: req.genuserId,
    };
    await dbModel.withdrawRef.create(withdrawRefObj);

    const updated = await updateWallet(
      req.genuserId,
      "TRX",
      data.withdrawAmount * 1000000,
      "credit",
      io
    );
    if (updated) {
      await dbModel.gaugeShare.updateMany(
        { ruserId: req.genuserId, status: 0, currency: "TRX" },
        { $set: { status: 1 } }
      );
      const settings = await dbModel.dividendSettings.findOne().lean();

      const fake_pool_amount =
        +settings.fake_pool_amount - +data.withdrawAmount;
      const pool_amount = +settings.pool_amount - +data.withdrawAmount;

      await dbModel.dividendSettings.updateOne(
        {},
        { $set: { pool_amount, fake_pool_amount } }
      );
      const updatedSettings = await dbModel.dividendSettings
        .findOne({ _id: settings._id })
        .lean();
      const getProfit = await common.update_profit(req.genuserId);

      io.emit("getdivi", {
        diviSettings: updatedSettings,
        profit: getProfit,
        address: req.genuserId,
      });
    }

    return {
      status: true,
      msg: "Redeem Referral Share Completed Successfully",
    };
  } catch (error) {
    console.log("withdraw", error);
    return { status: false, error: "An error occurred." };
  }
};

module.exports = {
  withdraw,
  updateWallet,
  createWallet,
  claim,
  redeem,
  redeemCashback,
  moveReference,
};
