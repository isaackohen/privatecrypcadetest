var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var dicewinmultiplierSchema = new Schema({
  userId: { type: String, default: "" },
  multiplier: { type: Number, default: 0 },
  createddate: { type: Date, default: Date.now },
});
module.exports = mongoose.model(
  "DicewinMultiplier",
  dicewinmultiplierSchema,
  "DicewinMultiplier"
);
