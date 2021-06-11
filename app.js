const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const Sanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const helmet = require("helmet");
const http = require("http");
const cors = require("cors");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const app = express();
const BalanceService = require("./services/balances");
const PoolService = require("./services/pool");

const config = require("./config");
const common = require("./helpers/common");
const { dbModel } = require("./model/db");
const { matic, eth, trx } = require("./model/routes");

const initRoutes = require("./router/initRoutes");
const crons = require("./crons");
const port = config.port;

mongoose
  .connect(config.dbconnection, { useNewUrlParser: true })
  .then(() => console.log("mongoose: connection successful"))
  .catch((err) => console.error(err));
mongoose.set("useFindAndModify", false);

app.use(cors());
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "50mb" }));
app.use(express.json());
app.use(cookieParser());
app.set("port111", port);
app.use(xss());
app.use(express.json({ limit: "10kb" }));
app.use(helmet());
app.use(Sanitize());
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "jade");
app.use(express.static("public"));
app.use(express.static(path.join(__dirname, "public")));
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  next();
});

initRoutes(app);

// todo - run only once to modify the db

const server = http.createServer(app);
server.listen(port, async () => {
  console.log(`Express server running on port ${port}`);
  await common.timerReHit(io);
});

// todo - remove this
// const getLuckyNo = (Min_rand, Max_rand) => {
//     const min = Math.ceil(Min_rand);
//     const max = Math.floor(Max_rand);
//     return Math.floor(Math.random() * (max - min + 1)) + min;
// }

// todo - remove this
// async function updateWalCircle(user_id,amount){
//   let walBalance = await dbModel.wallet.findOne({user_id: user_id}).lean();
//   let amountToUpdate = walBalance.wallet[0].amount/1000000;
// }

const io = require("./helpers/socket").listen(server);
io.on("connection", (socket) => {
  socket.on("get_ip", async (data1) => {
    let result = await dbModel.ipManagement.findOne({ ip: data1.ip });
    if (result) {
      io.emit("All_ip", { message: result });
    }
  });

  socket.on("get_message", async (data) => {
    var format = /[`!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/~]/;
    if (format.test(data.message)) {
      return false;
    }
    if (data.message && data.sender_address) {
      let chatMessage = await dbModel.chat.create(data);
      if (chatMessage) {
        let messageCount = await dbModel.chat.count();
        let aggregateQuery = [
          {
            $lookup: {
              from: "Users",
              localField: "sender_address",
              foreignField: "user_id",
              as: "user_info",
            },
          },
          { $unwind: "$user_info" },
          { $sort: { _id: 1 } },
        ];

        if (messageCount > 10) {
          aggregateQuery.push({ $skip: messageCount - 10 });
          var result = await dbModel.chat.aggregate(aggregateQuery);
          // var result = await dbModel.chat.find().sort({_id:1}).skip(messageCount-10).limit(10).lean();
        } else {
          var result = await dbModel.chat.aggregate(aggregateQuery);
          // var result = await dbModel.chat.find().sort({_id:1}).lean();
        }

        if (result) {
          result.map((items) => {
            let favLength = items.favourite;
            items.favcount = favLength.length;
          });
          io.sockets.emit("All_message", { message: result });
        }
      } else {
        res.json({ status: false, message: "Error" });
      }
    } else {
      res.json({ status: false, message: "Error" });
    }
  });

  socket.on("get_rooms", async (data2) => {
    let result = await dbModel.createRoom
      .find({ status: 1 })
      .sort({ _id: -1 })
      .limit(16);
    if (result) {
      io.sockets.emit("All_rooms", { message: result });
    }
  });

  socket.on("add_circle", async (data) => {
    const { currency, userId } = data;
    const betAmount = parseFloat(data.betAmount);
    const payout = +data.payout;

    const balanceService = new BalanceService();
    const poolService = new PoolService();

    let userTableData = await dbModel.users.findOne({ user_id: userId }).lean();
    data.rank = userTableData.rank;

    const wallet = await balanceService.getWalletBalances(data.userId);
    console.log({ wallet });

    const userbal = wallet[currency];

    if (userbal > 0 && userbal >= betAmount) {
      data.balBeforeBet = userbal;
      data.balAfterBet = userbal - betAmount;

      const circleData = await dbModel.circle.create(data);

      const newBalance = await balanceService.setWalletBalance(
        userId,
        currency,
        -betAmount,
        "$inc"
      );
      io.emit("getBal", { balance: newBalance, address: userId, currency });

      const circlebetdata = await dbModel.circleBet.create(data);

      let circeData = await dbModel.circle
        .findOne({ _id: circleData._id })
        .lean();
      circeData.user_docs = userTableData;
      io.sockets.emit("circleList", circeData);

      const updatedDividendSettings = await poolService.updatePoolAmount(
        betAmount,
        currency
      );

      const poolAmountKeys = poolService.getPoolAmountKeysByCurrencyCode(
        currency
      );

      const newPoolAmount = updatedDividendSettings[poolAmountKeys.pool_amount];
      const newFakePoolAmount =
        updatedDividendSettings[poolAmountKeys.fake_pool_amount];

      const previousPoolAmount = newPoolAmount - betAmount;
      const previousFakePoolAmount = newFakePoolAmount - betAmount;

      const share_data = {
        userid: data.userId,
        game: "Circle",
        betamount: parseFloat(data.betAmount),
        win: 0,
        real_org: previousPoolAmount,
        fake_org: previousFakePoolAmount,
        in_amt: betAmount,
        out_amt: 0,
        real_mod: parseFloat(newFakePoolAmount),
        fake_mod: parseFloat(newFakePoolAmount),
        shared_percentage: 0,
        shared_amount: 0,
      };
      await dbModel.share.create(share_data);
    }
  });

  socket.on("getprofit", async (data) => {
    const profit = await common.update_profit(req.body.userId);
    socket.emit("estimatedProfit", profit);
  });

  socket.on("add_roundList", async (data) => {
    await dbModel.circleRound.create(data);
    io.emit(
      "circleRoundList",
      await dbModel.circleRound.find().sort({ _id: -1 }).limit(40)
    );
  });
});

// run crons
crons.init(io);
crons.start();

// todo - remove it from here
let isRingActive = false;
app.get("/callTimer", async (req, res) => {
  if (!isRingActive) {
    isRingActive = true; // you should also clear all intervals
    // start ring game
    await common.timerReHit(io);
  } else {
    isRingActive = false;
  }
  res.json({ status: true });
});

app.post("/moveclaim", common.tokenMiddleware, async (req, res) => {
  const result = await trx.claim(req, io);
  res.json(result);
});

app.post("/ethmove", common.tokenMiddleware, async (req, res) => {
  const result = await eth.withdraw(req, io);
  res.json(result);
});

app.post("/maticmove", common.tokenMiddleware, async (req, res) => {
  const result = await matic.withdraw(req, io);
  res.json(result);
});

app.post("/move", common.tokenMiddleware, async (req, res) => {
  const result = await trx.withdraw(req, io);
  res.json(result);
});

app.post("/movedivident", common.tokenMiddleware, async (req, res) => {
  const result = await trx.redeem(req, io);
  res.json(result);
});

app.post("/moveethdivident", common.tokenMiddleware, async (req, res) => {
  const result = await eth.redeem(req, io);
  res.json(result);
});

app.post("/movematicdivident", common.tokenMiddleware, async (req, res) => {
  const result = await matic.redeem(req, io);
  res.json(result);
});

//move cashback
app.post("/moveRedeemCashback", common.tokenMiddleware, async (req, res) => {
  const result = await trx.redeemCashback(req, io);
  res.json(result);
});

app.post("/movereference", common.tokenMiddleware, async (req, res) => {
  const result = await trx.moveReference(req, io);
  res.json(result);
});

app.post("/movematicreference", common.tokenMiddleware, async (req, res) => {
  const result = await matic.moveReference(req, io);
  res.json(result);
});

app.get("/", (req, res) => {
  res.send("success");
});

// dev only
app.get("/logsPm2", (req, res) => {
  res.download(path.join(__dirname, "./logs/pm2/combined.outerr.log"));
});

process.on("SIGINT", () => {
  server.close((err) => {
    if (err) {
      console.error("Mongoose connection err", err);
      process.exit(1);
    }
    mongoose.connection.close(() => {
      console.log("Mongoose connection disconnected");
      process.exit(0);
    });
  });
});

module.exports = app;
