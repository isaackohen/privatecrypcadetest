var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var termsSchema = new Schema({
	"category":{type: String,default:""},
	"description":{type: String,default:""},
	"type":{type:String,default:""},
	"status":{type: Number,default:1},
	"createddate": { type: Date, default: Date.now }
});
module.exports = mongoose.model('Terms', termsSchema, 'Terms')