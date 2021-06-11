var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var gameTypeSchema = new Schema({
	"type":{type: String,default:""},
	"image":{type: String,default:""},
	"status":{type: Number,default:1},
	"createddate": { type: Date, default: Date.now },
});
module.exports = mongoose.model('GameType', gameTypeSchema, 'GameType')



