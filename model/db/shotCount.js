var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var betCountSchema = new Schema({
	"userId":{ type: String, default: ""},
	"betAmount":{ type: Number,default:0},
	"game_type":{ type: Number},
	"currency":{ type: String, default:"TRX"},
	"createddate": { type: Date, default: Date.now }
});
module.exports = mongoose.model('BetCount', betCountSchema, 'BetCount')
