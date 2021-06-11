var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var diceSettingsSchema = new Schema({
	"rollunder_max":{ type: String,default:""},
	"rollover_min":{ type: String,default:""},
	"multiplier":{ type: String,default:""},
	"min_betAmount":{ type: String,default:""},
	"max_betAmount":{ type: String,default:""},
	"min_betAmount_eth":{ type: String,default:""},
	"max_betAmount_eth":{ type: String,default:""},
	"min_betAmount_matic":{ type: String,default:""},
	"max_betAmount_matic":{ type: String,default:""},
	"max_prediction":{ type: String,default:""},
	"min_range":{ type: String,default:""},
	"max_range":{ type: String,default:""},
	"status":{type: Number,default:1},
	"firstlevel_start":{type: String,default:""},
	"firstlevel_end":{type: String,default:""},
	"firstlevel_percent":{type: String,default:""},
	"secondlevel_start":{type: String,default:""},
	"secondlevel_end":{type: String,default:""},
	"secondlevel_percent":{type: String,default:""},
	"thirdlevel_start":{type: String,default:""},
	"thirdlevel_percent":{type: String,default:""},
	"winnercount":{type: String,default:""},
	"heading1":{type: String,default:""},
	"heading2":{type: String,default:""},
	"heading3":{type: String,default:""},
	"share_content":{type: String,default:""},
	"createddate": { type: Date, default: Date.now }
});
module.exports = mongoose.model('DiceSetting', diceSettingsSchema, 'DiceSetting')



