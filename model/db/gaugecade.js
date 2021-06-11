var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var gaugetokenSchema = new Schema({
	"userId":{ type: String, default: ""},
	"ruserId":{ type: String, default: ""},
	"token_count":{ type: Number,default:0},
	"createddate": { type: Date, default: Date.now }
});
module.exports = mongoose.model('GaugeToken', gaugetokenSchema, 'GaugeToken')
