var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var gaugeshareSchema = new Schema({
  userId: { type: String, default: "" },
  ruserId: { type: String, default: "" },
  game: { type: String, default: "" },
  bet_amount: { type: Number, default: 0 },
  win_amount: { type: Number, default: 0 },
  commission_per: { type: Number, default: 0 },
  received_amount: { type: Number, default: 0 },
  currency: { type: String, default: "" },
  status: { type: Number, default: 0 },
  createddate: { type: Date, default: Date.now },
});
module.exports = mongoose.model("GaugeShare", gaugeshareSchema, "GaugeShare");
