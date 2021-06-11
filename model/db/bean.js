var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var beanSchema = new Schema({
  userId: { type: String, default: "" },
  available: { type: Number, default: 0 },
  freeze: { type: Number, default: 0 },
  createdDate: { type: Date, default: Date.now },
  updatedDate: { type: Date, default: "" },
});
module.exports = mongoose.model("Bean", beanSchema, "Bean");
