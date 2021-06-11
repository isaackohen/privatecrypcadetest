var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var gameSchema = new Schema({
	"type_id":{ type: mongoose.Schema.Types.ObjectId, ref: 'GameType'},
	"image":{type: String,default:""},
	"game":{type:String,default:""},
	"provider_id":{type:String,default:""},
	"provider":{type:String,default:""},
	"reference":{type:String,default:""},
	"description":{type:String,default:""},
	"url":{type:String,default:""},
	"status":{type: Number,default:1},
	"referenceName":{type:String,default:""},
	"tagName":{type:String,default:""},
	"nameSearch":{type:String,default:""},
	"display_mode":{type:String, default:""},
	"display_order":{type:Number, default:0},
	"createddate": { type: Date, default: Date.now }
});
module.exports = mongoose.model('Games', gameSchema, 'Games')



