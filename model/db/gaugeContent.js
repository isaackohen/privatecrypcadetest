var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var referalContentSchema = new Schema({
	"type":{ type: String, default: ""},
	"image":{ type: String,default:""},
	"header":{ type: String,default:""},
	"content":{ type: String,default:""},
	"createddate": { type: Date, default: Date.now }
});
module.exports = mongoose.model('ReferalContent', referalContentSchema, 'ReferalContent')
