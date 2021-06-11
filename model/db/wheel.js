var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var circleSchema = new Schema({
  level: { type: String, default: "" },
  currency: { type: String, default: "TRX" },
  betAmount: { type: Number, default: "" },
  roundId: { type: Number },
  payout: { type: Number, default: 0 },
  userId: { type: String, default: "" },
  status: { type: Number, default: 0 },
  balBeforeBet: { type: Number },
  balAfterBet: { type: Number },
  rank: { type: Number, default: 0 },
  createddate: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Circle", circleSchema, "Circle");
