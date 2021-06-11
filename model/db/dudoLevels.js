var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var diceLevelsSchema = new Schema({
	"userId":{ type: String, default: ""},
	"level":{ type: String,default:""},
	"count":{ type: Number,default:0},
	"random":{ type: String,default:""},
	"createddate": { type: Date, default: Date.now }
});
module.exports = mongoose.model('DiceLevel', diceLevelsSchema, 'DiceLevel')
