var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var circlecmsSchema = new Schema({
	"heading1":{ type: String,default:""},
	"heading2":{type: String,default:""},
	"heading3":{type: String,default:""},
	"share_content":{type: String,default:""},
	"status":{type: Number,default:1},
	"createddate": { type: Date, default: Date.now }
});

module.exports = mongoose.model('Circlecms', circlecmsSchema, 'Circlecms')

