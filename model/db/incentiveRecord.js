var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var bonusSchema = new Schema({
	"userId":{ type: String,default:""},
	"incentiveAmount":{ type: String,default:""},
	"oldRank":{ type: Number},
	"newRank":{ type: Number},
	"createddate": { type: Date, default: Date.now }
});
module.exports = mongoose.model('IncentiveRecord', bonusSchema, 'IncentiveRecord')