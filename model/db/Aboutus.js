var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var aboutusSchema = new Schema({
	"heading":{type: String,default:""},
	"type":{type:String,default:""},
	"description":{type: String,default:""},
	"image":{type: String,default:""},
	"status":{type: Number,default:1},
	"createddate": { type: Date, default: Date.now }
});
module.exports = mongoose.model('Aboutus', aboutusSchema, 'Aboutus')