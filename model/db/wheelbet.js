var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var circlebetSchema = new Schema({
	"level":{ type: String,default:""},
	"betAmount":{ type: Number,default:""},
	"roundId":{ type: Number},
	"payout":{type: Number,default:0},
	"userId":{type: String,default:""},
	"status":{type: Number,default:0},
	"createddate": { type: Date, default: Date.now }
});

module.exports = mongoose.model('Circlebet', circlebetSchema, 'Circlebet')



