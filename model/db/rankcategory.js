var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var rankcategoryTypeSchema = new Schema({
	"type":{type: String,default:""},
	"status":{type: Number,default:1},
	"createddate": { type: Date, default: Date.now },
});
module.exports = mongoose.model('RankCategory', rankcategoryTypeSchema, 'RankCategory');



