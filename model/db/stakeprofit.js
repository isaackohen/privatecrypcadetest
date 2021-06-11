var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var stakeprofitSchema = new Schema({
  userId: { type: String, default: "" },
  profit: { type: Number, default: 0 },
  currency: { type: String, default: "" },
  expiry_status: { type: Number, default: 0 },
  period: { type: Number, default: 0 },
  createddate: { type: Date, default: Date.now },
});
module.exports = mongoose.model(
  "stakeprofit",
  stakeprofitSchema,
  "stakeprofit"
);
