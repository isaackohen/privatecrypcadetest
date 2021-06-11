const mail = require("../../helpers/mailHelper");
const { dbModel } = require("../db");
const {
  getFrequentWithdrawal,
  setFrequentWithdrawal,
} = require("../../helpers/redis");
const { doRecaptcha } = require("../../helpers/captcha");
const MaticService = require("../../services/matic");
const powDivider = Math.pow(10, 18);
const Web3 = require("web3");
const config = require("../../config");
const common = require("../../helpers/common");

const updateWallet = async (address, currency, depositedAmount, type, io) => {
  const query = {
    "matic_wallet.address": address,
    "matic_wallet.currency": currency,
  };
  const wallet = await dbModel.wallet.findOne(query).lean();
  const trx_address = wallet.user_id;
  const balance = wallet.matic_wallet.amount ? wallet.matic_wallet.amount : 0;

  let setAmount;
  if (type === "credit") {
    setAmount = { $inc: { "matic_wallet.amount": depositedAmount } };
  } else {
    setAmount =
      balance > 0 ? { $inc: { "matic_wallet.amount": -depositedAmount } } : {};
  }

  try {
    const wallet = await dbModel.wallet
      .findOneAndUpdate(query, setAmount, { new: true })
      .lean();
    const balance = wallet.matic_wallet.amount / powDivider;
    io &&
      io.emit("getBal", { balance, address: trx_address, currency: "MATIC" });
    return { status: true };
  } catch (error) {
    console.log("updateWallet_matic", error);
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

    if (await getFrequentWithdrawal(req.genuserId, "MATIC")) {
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
    await setFrequentWithdrawal(req.genuserId, "MATIC"); // todo - maybe set it after withdraw successful

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
    const balance = +wallet.matic_wallet.amount / powDivider;

    const balanceWithdraw =
      parseFloat(userSett.matic_withdraw_amount) +
      parseFloat(data.withdrawAmount);
    const todyWithdraw =
      parseFloat(withdrawSett.matic_user_amountlimit) -
      parseFloat(userSett.matic_withdraw_amount);
    const platWithdrawLimit =
      parseFloat(withdrawSett.matic_platform_limit) -
      parseFloat(withdrawSett.entire_tdywithdraw_eth);

    if (parseFloat(data.withdrawAmount) > balance) {
      return {
        status,
        error: "Your wallet doesn't have that much balance to withdraw",
      };
    }

    if (
      parseFloat(data.withdrawAmount) <
      parseFloat(withdrawSett.min_maticwithdrawAmount)
    ) {
      return {
        status,
        error:
          "Withdraw amount should be greater than or equal to the minimum allowed",
      };
    }

    if (
      parseFloat(data.withdrawAmount) >
      parseFloat(withdrawSett.max_maticwithdrawAmount)
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
      parseFloat(userSett.matic_withdraw_count) >=
        parseFloat(withdrawSett.matic_user_countlimit) ||
      balanceWithdraw > parseFloat(withdrawSett.matic_user_amountlimit)
    ) {
      return {
        status,
        error: "You have reached the maximum withdrawal limit for today",
      };
    }

    const web3 = new Web3(config.eth.provider);
    const amount = web3.utils.toWei(data.withdrawAmount.toString());

    const maticService = new MaticService();

    const pool = await maticService.getBalance();
    const poolAmount = pool / powDivider;

    const contractWithdrawLimit = await maticService.getWithdrawLimit();
    const limitAmount = Number(contractWithdrawLimit._hex) / powDivider;

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
      wallet.matic_wallet.address,
      "MATIC",
      amount,
      "debit",
      io
    );
    const withdraw = await maticService.withdraw(
      amount,
      wallet.matic_wallet.address
    );
    if (withdraw.transactionHash) {
      const withdrawObj = {
        ip,
        txnid: withdraw.transactionHash,
        amount: data.withdrawAmount * powDivider,
        status: 1, // !withdraw.events.Withdraw.removed,
        currency: "MATIC",
        userId: req.genuserId,
        linkedAddress: wallet.matic_wallet.address,
      };
      await dbModel.withdraw.create(withdrawObj);

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
        wallet.matic_wallet.address,
        "MATIC",
        data.withdrawAmount * powDivider,
        "credit",
        io
      );
      return { status, error: "Transaction Failed" };
    }
  } catch (error) {
    console.log("maticWithdraw", error);
    return { status, error: "Some error occurred" };
  }
};

const redeem = async (req, io) => {
  try {
    const status = false;
    const data = req.body;
    const wallet = await dbModel.wallet
      .findOne({ user_id: req.genuserId })
      .lean();
    const totalData = await dbModel.dividendPool.aggregate([
      {
        $match: { userId: req.genuserId, expiry_status: 0, currency: "MATIC" },
      },
      { $group: { _id: null, amount: { $sum: "$distributed_amount" } } },
    ]);

    if (!+data.withdrawAmount || data.withdrawAmount <= 0) {
      return { status, error: "Invalid Amount" };
    }

    if (!wallet.matic_wallet.address) {
      return {
        status,
        error:
          "Please link an ETH address in your User Dashboard before you redeem",
      };
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
      amount: data.withdrawAmount * powDivider,
      status: 1,
      currency: "MATIC",
      userId: req.genuserId,
    };
    await dbModel.withdrawDividend.create(withdrawdiviObj);

    if (
      await updateWallet(
        wallet.matic_wallet.address,
        "MATIC",
        data.withdrawAmount * powDivider,
        "credit",
        io
      )
    ) {
      await dbModel.dividendPool.updateMany(
        { userId: req.genuserId, expiry_status: 0, currency: "MATIC" },
        { $set: { expiry_status: 1 } }
      );
      return { status: true, msg: "Redeem Completed Successfully" };
    }
  } catch (error) {
    console.log("withdraw", error);
    return { status, error: "An error occurred" };
  }
};

const moveReference = async (req, io) => {
  const data = req.body;
  const status = false;

  try {
    const totalData = await dbModel.gaugeShare.aggregate([
      { $match: { ruserId: req.genuserId, status: 0, currency: "MATIC" } },
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
      amount: data.withdrawAmount * powDivider,
      status: 1,
      currency: "MATIC",
      userId: req.genuserId,
    };
    await dbModel.withdrawRef.create(withdrawRefObj);
    const wallet = await dbModel.wallet
      .findOne({ user_id: req.genuserId })
      .lean();

    const updated = await updateWallet(
      wallet.matic_wallet.address,
      "MATIC",
      data.withdrawAmount * powDivider,
      "credit",
      io
    );

    if (updated) {
      await dbModel.gaugeShare.updateMany(
        { ruserId: req.genuserId, status: 0, currency: "MATIC" },
        { $set: { status: 1 } }
      );
      const settings = await dbModel.dividendSettings.findOne().lean();

      const matic_fake_pool_amount =
        +settings.matic_fake_pool_amount - +data.withdrawAmount;
      const matic_pool_amount =
        +settings.matic_pool_amount - +data.withdrawAmount;

      await dbModel.dividendSettings.updateOne(
        {},
        { $set: { matic_pool_amount, matic_fake_pool_amount } }
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
  updateWallet,
  withdraw,
  redeem,
  moveReference,
  // createWallet,
};
