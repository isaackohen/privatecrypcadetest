var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var slotSchema = new Schema({
  providerid: { type: String, default: "" },
  gameid: { type: String, default: "" },
  gameName: { type: String, default: "" },
  userid: { type: mongoose.Schema.Types.ObjectId, ref: "UserWallet" },
  md5: { type: String, default: "" },
  amount: { type: Number, default: 0 },
  remotetranid: { type: String, default: "" },
  trntype: { type: String, default: "" },
  roundid: { type: String, default: "" },
  roomid: { type: String, default: "" },
  currency: { type: String, default: "" },
  freespin_id: { type: String, default: "" },
  finished: { type: String, default: "" },
  status: { type: Number, default: 0 },
  rank: { type: Number, default: 0 },
  converted: { type: Number, default: 0 },
  createddate: { type: Date, default: Date.now },
});
slotSchema.index({ createddate: 1, userid: 1 });
module.exports = mongoose.model("Slots", slotSchema, "Slots");
