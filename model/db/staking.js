var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var stakingSchema = new Schema({
  userId: { type: String, default: "" },
  amount: { type: Number, default: 0 },
  periods: { type: Number, default: 0 },
  currency: { type: String, default: "TRX" },
  status: { type: Number, default: 0 },
  autoOption: { type: Number, default: 0 },
  profit: { type: Number, default: 0 },
  tokens: { type: Number, default: 0 },
  createdDate: { type: Date, default: Date.now },
});
module.exports = mongoose.model("Staking", stakingSchema, "Staking");
