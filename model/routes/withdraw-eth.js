const mail = require("../../helpers/mailHelper");
const { dbModel } = require("../db");
const {
  getFrequentWithdrawal,
  setFrequentWithdrawal,
} = require("../../helpers/redis");
const { doRecaptcha } = require("../../helpers/captcha");
const EthService = require("../../services/eth");
const powDivider = Math.pow(10, 18);

const updateWallet = async (address, currency, depositedAmount, type, io) => {
  const query = {
    "eth_wallet.address": address,
  };
  const wallet = await dbModel.wallet.findOne(query).lean();
  const trx_address = wallet.user_id;
  const balance = wallet.eth_wallet.amount ? wallet.eth_wallet.amount : 0;

  let setAmount;
  if (type === "credit") {
    setAmount = { $inc: { "eth_wallet.amount": depositedAmount } };
  } else {
    setAmount =
      balance > 0 ? { $inc: { "eth_wallet.amount": -depositedAmount } } : {};
  }

  try {
    const wallet = await dbModel.wallet
      .findOneAndUpdate(query, setAmount, { new: true })
      .lean();
    const balance = wallet.eth_wallet.amount / powDivider;
    io && io.emit("getBal", { balance, address: trx_address, currency: "ETH" });
    return { status: true };
  } catch (error) {
    console.log("updateWallet_eth", error);
  }
};

const redeem = async (req, io) => {
  try {
    const status = false;
    const data = req.body;
    const totalData = await dbModel.dividendPool.aggregate([
      { $match: { userId: req.genuserId, expiry_status: 0, currency: "ETH" } },
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

    const userSett = await dbModel.users
      .findOne({ user_id: req.genuserId })
      .lean();
    const wallet = await dbModel.wallet
      .findOne({ user_id: req.genuserId })
      .lean();

    const withdrawdiviObj = {
      amount: data.withdrawAmount * powDivider,
      status: 1,
      currency: "ETH",
      userId: req.genuserId,
    };

    await dbModel.withdrawDividend.create(withdrawdiviObj);

    if (
      await updateWallet(
        wallet.eth_wallet.address,
        "ETH",
        data.withdrawAmount * powDivider,
        "credit",
        io
      )
    ) {
      await dbModel.dividendPool.updateMany(
        { userId: req.genuserId, expiry_status: 0, currency: "ETH" },
        { $set: { expiry_status: 1 } }
      );
      return { status: true, msg: "Redeem Completed Successfully" };
    }
  } catch (error) {
    console.log("withdraw", error);
    return { status, error: "An error occurred" };
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
    if (await getFrequentWithdrawal(req.genuserId, "ETH")) {
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
    await setFrequentWithdrawal(req.genuserId, "ETH"); // todo - maybe set it after withdraw successful

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
    const balance = +wallet.eth_wallet.amount / powDivider;

    const balanceWithdraw =
      parseFloat(userSett.eth_withdraw_amount) +
      parseFloat(data.withdrawAmount);
    const todyWithdraw =
      parseFloat(withdrawSett.eth_user_amountlimit) -
      parseFloat(userSett.eth_withdraw_amount);
    const platWithdrawLimit =
      parseFloat(withdrawSett.eth_platform_limit) -
      parseFloat(withdrawSett.entire_tdywithdraw_eth);

    if (parseFloat(data.withdrawAmount) > balance) {
      return {
        status,
        error: "Your wallet doesn't have that much balance to withdraw",
      };
    }

    if (
      parseFloat(data.withdrawAmount) <
      parseFloat(withdrawSett.min_ethwithdrawAmount)
    ) {
      return {
        status,
        error:
          "Withdraw amount should be greater than or equal to the minimum allowed",
      };
    }

    if (
      parseFloat(data.withdrawAmount) >
      parseFloat(withdrawSett.max_ethwithdrawAmount)
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
      parseFloat(userSett.eth_withdraw_count) >=
        parseFloat(withdrawSett.eth_user_countlimit) ||
      balanceWithdraw > parseFloat(withdrawSett.eth_user_amountlimit)
    ) {
      return {
        status,
        error: "You have reached the maximum withdrawal limit for today",
      };
    }

    const amount = data.withdrawAmount * powDivider;

    const ethService = new EthService();
    // const amount = 1 * Math.pow(10,18); // for debug only

    const pool = await ethService.getBalance();
    const poolAmount = pool / powDivider;
    const contractWithdrawLimit = await ethService.getWithdrawLimit();
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

    await updateWallet(wallet.eth_wallet.address, "ETH", amount, "debit", io);
    const withdraw = await ethService.withdraw(
      `${amount}`,
      wallet.eth_wallet.address
    );
    if (withdraw.transactionHash) {
      const withdrawObj = {
        ip,
        txnid: withdraw.transactionHash,
        amount: data.withdrawAmount * powDivider,
        status: 1, // !withdraw.events.Withdraw.removed,
        currency: "ETH",
        userId: req.genuserId,
        linkedAddress: wallet.eth_wallet.address,
      };
      await dbModel.withdraw.create(withdrawObj);
      const withdraw_count = parseFloat(userSett.eth_withdraw_count) + 1;
      const withdraw_amount =
        parseFloat(userSett.withdraw_amount) + parseFloat(data.withdrawAmount);
      const today_withdraw =
        parseFloat(withdrawSett.entire_tdywithdraw_eth) +
        parseFloat(data.withdrawAmount);
      await dbModel.users.updateOne(
        { user_id: req.genuserId },
        { $set: { withdraw_count, withdraw_amount } }
      );
      await dbModel.withdrawSetting.updateOne(
        {},
        { $set: { entire_tdywithdraw_eth: today_withdraw } }
      );

      return { status: true, msg: "Withdraw Completed Successfully" };
    } else {
      await updateWallet(
        wallet.eth_wallet.address,
        "ETH",
        data.withdrawAmount * powDivider,
        "credit",
        io
      );
      return { status, error: "Transaction Failed" };
    }
  } catch (error) {
    console.log("eth withdraw", error);
    return { status, error: "Some error occurred" };
  }
};

module.exports = {
  withdraw,
  updateWallet,
  redeem,
  // createWallet,
};
