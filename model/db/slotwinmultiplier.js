var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var slotwinmultiplierSchema = new Schema({
  userId: { type: String, default: "" },
  betAmount: { type: Number, default: 0 },
  winAmount: { type: Number, default: 0 },
  roundid: { type: String, default: "" },
  providerid: { type: String, default: "" },
  multiplier: { type: String, default: "" },
  createddate: { type: Date, default: Date.now },
});
module.exports = mongoose.model(
  "SlotwinMultiplier",
  slotwinmultiplierSchema,
  "SlotwinMultiplier"
);
