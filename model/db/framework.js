var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var sitesettingSchema = new Schema({
  copyrights: { type: String, default: "" },
  facebook: { type: String, default: "" },
  instagram: { type: String, default: "" },
  youtube: { type: String, default: "" },
  media: { type: String, default: "" },
  sitename: { type: String, default: "" },
  site_maintenance: { type: Number, default: 0 },
  sitetitle: { type: String, default: "" },
  twitter: { type: String, default: "" },
  sitelogo: { type: String, default: "" },
  favicon: { type: String, default: "" },
  contactmail: { type: String, default: "" },
  contactphone: { type: String, default: "" },
  footercontent: { type: String, default: "" },
  subscriptioncontent: { type: String, default: "" },
  contractAddress: { type: String },
  ethcontractAddress: { type: String },
  maticcontractAddress: { type: String },
  beancontractAddress: { type: String },
  adminAddress: { type: String },
  admin_cold_wallet: { type: String },
  eth_cold_wallet: { type: String },
  supportmail: { type: String, default: "" },
  telegram: { type: String, default: "" },
  referal_percent: { type: Number, default: 0 },
  ethblockcount: { type: Number, default: 0 },
  maticblockcount: { type: Number, default: 0 },
  referal_cade: { type: Number, default: 0 },
  telegram_news: { type: String, default: "" },
  page_enable:{type: Number, default: 0},
});
module.exports = mongoose.model(
  "sitesetting",
  sitesettingSchema,
  "sitesetting"
);
