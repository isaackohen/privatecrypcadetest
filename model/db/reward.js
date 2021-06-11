var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var dividendpoolSchema = new Schema({
	"userId":{ type: String, default: ""},
	"freezed_tokens":{ type: Number,default:0},
	"distributed_amount":{ type: Number},
	"expiry_status":{type:Number,default:0},
	"currency":{type:String, default:""},
	"createddate": { type: Date, default: Date.now }
});
module.exports = mongoose.model('DividendPool', dividendpoolSchema, 'DividendPool')
