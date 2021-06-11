const express = require("express");
var mongoose = require("mongoose");
const router = express.Router();
var gameType = require("../model/db/contestType");
var games = require("../model/db/games");
var async = require("async");
var cloudinary = require("cloudinary");
var multer = require("multer");
var config = require("../config");
let common = require("../helpers/common");

//GameType

// Admin
router.get("/get_gameType", common.whitelistMiddleware, async function (
  req,
  res
) {
  try {
    var gameTypeData = await gameType.find();
    res.json({ status: true, data: gameTypeData });
  } catch (e) {
    res.json({ status: false });
    console.log("get_gameType", e);
  }
});

// Admin
router.post("/add_gameType", common.whitelistMiddleware, async function (
  req,
  res
) {
  var data = req.body;
  try {
    if (data._id) {
      var updategameType = await gameType.update(
        { _id: data._id },
        { $set: data }
      );
      res.json({ status: true, msg: "Updated Successfully!" });
    } else {
      var gameTypeData = await gameType.create(data);
      if (gameTypeData) {
        res.json({ status: true, msg: "Created Successfully!" });
      } else {
        res.json({ status: false, msg: "Unable to Create" });
      }
    }
  } catch (e) {
    res.json({ status: false });
    console.log("add_gameType", e);
  }
});

//Project
router.get("/gameTypeList", common.whitelistMiddleware, async function (
  req,
  res
) {
  try {
    var gameTypeData = await gameType.find({ status: 1 });
    res.json({ status: true, data: gameTypeData });
  } catch (e) {
    res.json({ status: false });
    console.log("gameTypeList", e);
  }
});

router.post("/gameSearch", common.whitelistMiddleware, async function (
  req,
  res
) {
  let data = req.body;
  try {
    let conditions = {
      nameSearch: { $regex: ".*" + data.search + ".*", $options: "i" },
    };
    if (data.game) {
      if (data.game == "In House") {
        conditions.provider = "crypcade";
      } else {
        conditions.game = data.game;
      }
    }
    conditions.status = 1;
    let gameCount = await games.count(conditions);
    let gameDataSearch = await games.find(conditions).limit(data.limit);
    res.json({ status: true, data: gameDataSearch, count: gameCount });
  } catch (e) {
    res.json({ status: false });
    console.log("gameSearch", e);
  }
});

//Games

//Admin
router.get("/get_games", common.whitelistMiddleware, async function (req, res) {
  try {
    var gameData = await games.find().populate("type_id");
    res.json({ status: true, data: gameData });
  } catch (e) {
    res.json({ status: false });
    console.log("get_games", e);
  }
});

//Admin
router.post("/add_games", common.whitelistMiddleware, async function (
  req,
  res
) {
  var data = req.body;
  try {
    if (data._id) {
      var updategame = await games.update({ _id: data._id }, { $set: data });
      if (data.reference == "Circle" && data.status == 0) {
        io.emit("underMaintenance", {});
      }
      res.json({ status: true, msg: "Updated Successfully!" });
    } else {
      var gameData = await games.create(data);
      if (gameData) {
        res.json({ status: true, msg: "Created Successfully!" });
      } else {
        res.json({ status: false, msg: "Unable to Create" });
      }
    }
  } catch (e) {
    res.json({ status: false });
    console.log("add_games", e);
  }
});

//Project
router.get("/gamesList", common.whitelistMiddleware, async function (req, res) {
  try {
    let data = req.body;
    var gameTypeData = await games.find({ status: 1 });
    res.json({ status: true, data: gameTypeData });
  } catch (e) {
    res.json({ status: false });
    console.log("gamesList", e);
  }
});

router.post("/gamesListByLimit", common.whitelistMiddleware, async function (
  req,
  res
) {
  try {
    let data = req.body;
    var gameTypeData = await games.find({ status: 1 }).limit(data.limit);
    res.json({ status: true, data: gameTypeData });
  } catch (e) {
    res.json({ status: false });
    console.log("gamesList", e);
  }
});

router.post("/slotsListByLimit", common.whitelistMiddleware, async function (
  req,
  res
) {
  try {
    let data = req.body;
    var gameTypeData = await games
      .find({ status: 1, game: "Slots" })
      .limit(data.limit);
    res.json({ status: true, data: gameTypeData });
  } catch (e) {
    res.json({ status: false });
    console.log("gamesList", e);
  }
});

router.post("/inhouseListByLimit", common.whitelistMiddleware, async function (
  req,
  res
) {
  try {
    let data = req.body;
    var gameTypeData = await games
      .find({ status: 1, provider: "crypcade" })
      .limit(data.limit);
    res.json({ status: true, data: gameTypeData });
  } catch (e) {
    res.json({ status: false });
    console.log("gamesList", e);
  }
});

router.post("/tableListByLimit", common.whitelistMiddleware, async function (
  req,
  res
) {
  try {
    let data = req.body;
    var gameTypeData = await games
      .find({ status: 1, game: "Table Games" })
      .limit(data.limit);
    res.json({ status: true, data: gameTypeData });
  } catch (e) {
    res.json({ status: false });
    console.log("gamesList", e);
  }
});

router.get("/getGameslist", common.whitelistMiddleware, async function (
  req,
  res
) {
  try {
    var gameData = await games.find({ status: 1 }).populate("type_id");
    res.json({ status: true, data: gameData });
  } catch (e) {
    res.json({ status: false });
    console.log("get_games", e);
  }
});

router.post("/gamesAll", common.whitelistMiddleware, async function (req, res) {
  try {
    var gameTypeData = await games.findOne({ _id: req.body._id });
    res.json({ status: true, data: gameTypeData });
  } catch (e) {
    res.json({ status: false });
    console.log("gamesAll", e);
  }
});

router.post("/getgame", common.whitelistMiddleware, async function (req, res) {
  var data = req.body;
  try {
    if (data) {
      var gameTypeData = await games.findOne({ reference: data.reference });
      res.json({ status: true, data: gameTypeData });
    }
  } catch (e) {
    res.json({ status: false });
    console.log("getgame", e);
  }
});

router.get("/get_games_count", common.whitelistMiddleware, async function (
  req,
  res
) {
  try {
    var gameData = await games.find();
    if (gameData.length > 0) {
      count = gameData.length;
    } else {
      count = 0;
    }
    res.json({ status: true, data: count });
  } catch (e) {
    res.json({ status: false });
    console.log("get_games", e);
  }
});

router.post("/gamesWithSort", common.whitelistMiddleware, async function (
  req,
  res
) {
  try {
    let gameConditions = {};
    let data = req.body;
    let query;
    if (data.search_str) {
      gameConditions = {
        nameSearch: { $regex: ".*" + data.search_str + ".*", $options: "i" },
      };
    }
    if (data.game) {
      if (data.game == "In House") {
        gameConditions.provider = "crypcade";
      } else {
        gameConditions.game = data.game;
      }
    }

    if (data.tagName) {
      gameConditions.tagName = data.tagName;
    }
    if (data.provider && data.game != "In House") {
      gameConditions.provider = data.provider;
    }

    if (data.devicename == "Sys") {
      gameConditions.display_mode = ["Normal", "Both"];
    } else {
      gameConditions.display_mode = ["Mobile", "Both"];
    }
    gameConditions.status = 1;
    if (data.search == "atoz" || data.search == "ztoa") {
      query = await games
        .find(gameConditions)
        .sort({
          referenceName: data.search == "atoz" ? 1 : -1,
          display_order: -1,
        })
        .limit(data.limit)
        .lean();
    } else {
      query = await games
        .find(gameConditions)
        .sort({ display_order: -1 })
        .limit(data.limit)
        .lean();
    }
    let gameCount = await games.count(gameConditions);
    let gameSearch = query;
    res.json({ status: true, data: gameSearch, count: gameCount });
  } catch (e) {
    res.json({ status: false });
    console.log("gamesWithSort", e);
  }
});

module.exports = router;
