var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var ticketsystemSchema = new Schema({
  currency: { type: String },
  startdate: { type: Date },
  enddate: { type: Date },
  status: { type: Number, default: 0 },
  betcount: { type: Number, default: 0 },
  createddate: { type: Date, default: Date.now },
});
module.exports = mongoose.model(
  "TicketSystem",
  ticketsystemSchema,
  "TicketSystem"
);
