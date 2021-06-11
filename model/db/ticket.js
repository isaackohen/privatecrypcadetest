var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var ticketSchema = new Schema({
  userId: { type: String },
  tickets: { type: Number, default: 0 },
});
module.exports = mongoose.model("ticket", ticketSchema, "ticket");
