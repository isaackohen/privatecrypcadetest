var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var slotSettingsSchema = new Schema({
  demo_url: { type: String, default: "" },
  bg_demo_url: { type: String, default: "" },
  en_demo_url: { type: String, default: "" },
  live_url: { type: String, default: "" },
  bg_live_url: { type: String, default: "" },
  en_live_url: { type: String, default: "" },
  endorphina_nodeid: { type: Number, default: "" },
  key: { type: String, default: "" },
  ethkey: { type: String, default: "" },
  matickey: { type: String, default: "" },
  lobby_url: { type: String, default: "" },
  platipus_share: { type: String, default: "" },
  platipus_share_address: { type: String, default: "" },
  platipus_restriction: { type: String, default: "" },
  booongo_restriction: { type: String, default: "" },
  slotgat_restriction: { type: String, default: "" },
});
module.exports = mongoose.model(
  "SlotSetting",
  slotSettingsSchema,
  "SlotSetting"
);
