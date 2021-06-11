var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var ticketCountSchema = new Schema({
  userId: { type: String, default: "" },
  betAmount: { type: Number, default: 0 },
  currency: { type: String, default: "TRX" },
  createddate: { type: Date, default: Date.now },
});
module.exports = mongoose.model(
  "TicketCount",
  ticketCountSchema,
  "TicketCount"
);
