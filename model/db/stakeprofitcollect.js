var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var stakeprofitcollectSchema = new Schema({
  userId: { type: String, default: "" },
  amount: { type: Number, default: 0 },
  periods: { type: Number, default: 0 },
  currency: { type: String, default: "TRX" },
  createdDate: { type: Date, default: Date.now },
});
module.exports = mongoose.model(
  "stakeprofitcollect",
  stakeprofitcollectSchema,
  "stakeprofitcollect"
);
