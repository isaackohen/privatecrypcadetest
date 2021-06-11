var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var beantokenactionSchema = new Schema({
  userId: { type: String },
  currency: { type: String },
  amount: { type: Number, default: 0 },
  createddate: { type: Date, default: Date.now },
  updatedDate: { type: Date, default: "" },
});
module.exports = mongoose.model(
  "beantokenaction",
  beantokenactionSchema,
  "beantokenaction"
);
