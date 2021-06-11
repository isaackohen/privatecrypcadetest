const express = require("express");
const router = express.Router();
var user = require("../model/db/customer");
var wallet = require("../model/db/wallet");
let common = require("../helpers/common");
var usermanagement = require("../model/db/authorityuser");
const { dbModel } = require("../model/db");

router.get("/get_total", common.whitelistMiddleware, async (req, res) => {
  try {
    const totalData = await dbModel.wallet.aggregate([
      { $unwind: "$trx_wallet" },
      { $group: { _id: null, amount: { $sum: "$trx_wallet.amount" } } },
    ]);
    res.json({ status: true, data: totalData[0].amount });
  } catch (error) {
    res.json({ status: false });
    console.log("get_total", error);
  }
});

router.post("/get_id", common.tokenMiddleware, async (req, res) => {
  try {
    const userData = await dbModel.users
      .findOne({ user_id: req.body.user_id })
      .lean();
    if (userData) {
      res.json({ status: true, data: userData });
    } else {
      res.json({ status: false });
    }
  } catch (error) {
    res.json({ status: false });
    console.log("get_id", error);
  }
});

router.post("/reg", common.whitelistMiddleware, async (req, res) => {
  try {
    const userData = await dbModel.users
      .findOne({ user_id: req.body.user_id })
      .lean();
    if (userData) {
      res.json({ status: true, data: userData });
    } else {
      res.json({ status: false });
    }
  } catch (e) {
    res.json({ status: false });
    console.log("get_id", e);
  }
});

router.post("/get_user", common.tokenMiddleware, async (req, res) => {
  try {
    const userData = await dbModel.users
      .findOne({ user_id: req.body.user_id })
      .lean();
    if (userData && userData.invitedBy) {
      const add = await dbModel.users.findOne({ _id: userData.invitedBy });
      if (add) {
        userData.address = add.user_id;
        res.json({ status: true, data: userData });
      } else {
        res.json({ status: false });
      }
    } else {
      userData.address = null;
      res.json({ status: true, data: userData });
    }
  } catch (error) {
    res.json({ status: false });
    console.log("get_user", error);
  }
});

router.post("/add_init", common.whitelistMiddleware, async (req, res) => {
  try {
    const userData = await dbModel.users.findOne({ user_id: req.body.user_id });
    if (!userData) {
      await dbModel.users.create({ user_id: req.body.user_id });
      res.json({ status: true, msg: "Success" });
    } else {
      res.json({ status: false });
    }
  } catch (error) {
    res.json({ status: false });
    console.log("add_user", error);
  }
});

router.post("/usermanage_add", common.whitelistMiddleware, async (req, res) => {
  try {
    const data = req.body;
    const userData = await dbModel.userManagement.findOne({
      user_address: data.user_id,
    });
    if (!userData && data.user_id) {
      await dbModel.userManagement.create({ user_address: data.user_id });
      res.json({ status: true, msg: "Success" });
    } else {
      res.json({ status: false });
    }
  } catch (error) {
    res.json({ status: false });
    console.log("usermanage_add", error);
  }
});

router.post("/get_userblock", common.whitelistMiddleware, async (req, res) => {
  try {
    const data = req.body;
    const userData = await dbModel.userManagement.findOne({
      user_address: data.user_id,
      status: 0,
    });
    if (userData) {
      res.json({ status: true, msg: "Success" });
    } else {
      res.json({ status: false });
    }
  } catch (error) {
    res.json({ status: false });
    console.log("get_userblock", error);
  }
});

router.post(
  "/get_userregister",
  common.whitelistMiddleware,
  async (req, res) => {
    try {
      const data = req.body;
      const user_id = data.user_id;
      const wallet = await dbModel.wallet.findOne({ user_id: user_id }).lean();
      if (!wallet) {
        const newWallet = {
          user_id,
          trx_wallet: { currency: "TRX", amount: 0, address: user_id },
          eth_wallet: { currency: "ETH", amount: 0, address: "" },
          matic_wallet: { currency: "MATIC", amount: 0, address: "" },
        };
        const created = await dbModel.wallet.create(newWallet);
        if (created) {
          const wallet = await dbModel.wallet.findOne({ user_id: user_id });
          const balance = wallet.trx_wallet.amount / 1000000;
          const address = wallet.trx_wallet.address;
          const currency = "TRX";
          io && io.emit("getBal", { balance, address, currency });
        }
        res.json({ status: true, msg: "Success" });
      } else {
        res.json({ status: false, msg: "Fail" });
      }
    } catch (error) {
      res.json({ status: false });
      console.log("get_userregister", error);
    }
  }
);

router.post("/update_invite", common.tokenMiddleware, async (req, res) => {
  try {
    const data = req.body;
    if (!data.user_id || data.invitedBy || !data.invitedBy) {
      res.json({ status: false });
      return;
    }

    const usr_det = await dbModel.users
      .findOne({ user_id: data.user_id })
      .lean();
    if (usr_det.invitedBy || usr_det._id === data.invitedBy) {
      return;
    }

    const addUser = await dbModel.users.updateOne(
      { user_id: data.user_id },
      { $set: { invitedBy: data.invitedBy } }
    );
    if (addUser) {
      const use_Data = await dbModel.users
        .findOne({ _id: data.invitedBy })
        .lean();
      const inc_cnt = use_Data.invitedCount ? +use_Data.invitedCount + 1 : 1;
      await dbModel.users.updateOne(
        { _id: data.invitedBy },
        { $set: { invitedCount: inc_cnt } }
      );
      res.json({ status: true });
    } else {
      res.json({ status: false });
    }
  } catch (error) {
    res.json({ status: false });
    console.log("add_user", error);
  }
});

router.post("/add_user", common.tokenMiddleware, async function (req, res) {
  try {
    let data = req.body;
    if (data.user_id && data.invitedBy) {
      let wallets = await wallet.findOne({ user_id: data.user_id });
      if (!wallets) {
        let addUser = await user.findOneAndUpdate(
          { user_id: data.user_id },
          { invitedBy: data.invitedBy },
          { new: true }
        );
        if (addUser) {
          // let user1= await user.findOne({_id:req.body.invitedBy});
          // let increment=user.invitedCount+1
          var userdata = await user.update(
            { _id: req.body.invitedBy },
            { $inc: { invitedCount: 1 } }
          );
          if (userdata) {
            res.json({ status: true, msg: "Updated successfully!" });
          } else {
            res.json({ status: false });
          }
        } else {
          res.json({ status: false });
        }
      } else {
        res.json({ status: false, msg: "Your account is already created" });
      }
    } else {
      res.json({ status: false });
    }
  } catch (e) {
    res.json({ status: false });
    console.log("add_user", e);
  }
});

router.get("/get_referal", common.whitelistMiddleware, async function (
  req,
  res
) {
  try {
    var userData = await user.find({ invitedCount: { $gt: 0 } });
    if (userData) {
      res.json({ status: true, data: userData });
    } else {
      res.json({ status: false });
    }
  } catch (e) {
    res.json({ status: false });
    console.log("get_id", e);
  }
});

router.post("/get_allreferal", common.whitelistMiddleware, async function (
  req,
  res
) {
  try {
    var slotData = await user.find({ invitedBy: req.body._id });
    if (slotData) {
      res.json({ status: true, data: slotData });
    } else {
      res.json({ status: false });
    }
  } catch (e) {
    res.json({ status: false });
    console.log("get_id", e);
  }
});

router.post("/regd", common.whitelistMiddleware, async function (req, res) {
  let data = req.body;
  var addr = await user.findOne({ _id: data.encd }).lean();
  try {
    if (addr) {
      var gentoken = common.createPayload(addr.user_id);
      res.json({ status: true, data: gentoken });
    } else {
      res.json({ status: false });
    }
  } catch (e) {
    res.json({ status: false });
    console.log("gettoken", e);
  }
});

module.exports = router;
