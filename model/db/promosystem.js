var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var promosystemSchema = new Schema({
  promotitle: { type: String },
  startdate: { type: Date },
  enddate: { type: Date },
  status: { type: Number, default: 0 },
  createddate: { type: Date, default: Date.now },
});
module.exports = mongoose.model(
  "PromoSystem",
  promosystemSchema,
  "PromoSystem"
);
