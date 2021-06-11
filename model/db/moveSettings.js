var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var withdrawSettingsSchema = new Schema({
	"user_countlimit":{ type: String,default:""},
	"user_amountlimit":{ type: String,default:""},
	"eth_user_countlimit":{ type: String,default:""},
	"eth_user_amountlimit":{ type: String,default:""},
	"matic_user_countlimit":{ type: String,default:""},
	"matic_user_amountlimit":{ type: String,default:""},
	"min_withdrawAmount":{ type: String,default:""},
	"min_ethwithdrawAmount":{ type: String,default:""},
	"min_maticwithdrawAmount":{ type: String,default:""},
	"min_depositAmount":{ type: String,default:""},
	"min_ethdepositAmount":{ type: String,default:""},
	"min_maticdepositAmount":{ type: String,default:""},
	"max_withdrawAmount":{type:String,default:""},
	"max_ethwithdrawAmount":{type:String,default:""},
	"max_maticwithdrawAmount":{type:String,default:""},
	"move_percentage":{type:Number},
	"platform_limit":{type:String,default:""},
	"eth_platform_limit":{type:String,default:""},
	"matic_platform_limit":{type:String,default:""},
	"withdraw_enable":{type:Number,default:0},
	"eth_withdraw_enable":{type:Number, default:0},
	"matic_withdraw_enable":{type: Number, default:0},
	"disable_reason":{type:String,default:""},
	"deposit_enable":{type:Number,default:0},
	"eth_deposit_enable":{type:Number, default:0},
	"matic_deposit_enable":{type: Number, default:0},
	"deposit_disable_reason":{type:String,default:""},
	"pool_amount":{type:Number,default:0},
	"entire_tdywithdraw":{type:String, default:""},
	"entire_tdywithdraw_eth":{type:String, default:""},
	"entire_tdywithdraw_matic":{type:String, default:""},
	"createddate": { type: Date, default: Date.now }
});
module.exports = mongoose.model('WithdrawSetting', withdrawSettingsSchema, 'WithdrawSetting')



