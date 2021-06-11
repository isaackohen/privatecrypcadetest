var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var circleSettingsSchema = new Schema({
  level: { type: String, default: "" },
  min_betAmount: { type: String, default: "" },
  max_betAmount: { type: String, default: "" },
  min_betAmount_matic: { type: String, default: "" },
  max_betAmount_matic: { type: String, default: "" },
  min_betAmount_eth: { type: String, default: "" },
  max_betAmount_eth: { type: String, default: "" },
  createddate: { type: Date, default: Date.now },
});
module.exports = mongoose.model(
  "CircleSetting",
  circleSettingsSchema,
  "CircleSetting"
);
