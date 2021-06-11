var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var shopBoxesSchema = new Schema({
	"image":{type: String,default: ""},
	"price":{type: Number,default: 0},
	"currency":{type: String,default: ""},
	"amount":{type: Number,default:1},
	"multiplier":  {
		"min": { type: Number, default: 0},
		"max": { type: Number, default: 0},
	},
	"active": { type: Boolean, default: false}
});

module.exports = mongoose.model('ShopBoxes', shopBoxesSchema, 'ShopBoxes')

