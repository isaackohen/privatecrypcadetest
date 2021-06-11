var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var roadMapSchema = new Schema({
	"year":{ type: String,default:""},
	"description":{type: String,default:""},
	"status":{type: Number,default:1},
	"createddate": { type: Date, default: Date.now }
});
module.exports = mongoose.model('RoadMap', roadMapSchema, 'RoadMap')



