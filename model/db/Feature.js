var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var featureSchema = new Schema({
	"heading":{type: String,default:""},
	"description":{type: String,default:""},
	"image":{type: String,default:""},
	"status":{type: Number,default:1},
	"createddate": { type: Date, default: Date.now }
});
module.exports = mongoose.model('Feature', featureSchema, 'Feature')