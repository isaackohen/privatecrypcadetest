var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var bannerSchema = new Schema({
	"text1":{ type: String,default:""},
	"text2":{ type: String,default:""},
	"text3":{ type: String,default:""},
	"buttontext":{ type: String,default:""},
	"buttonlink":{ type: String,default:""},
	"image":{type:String, default:"" },
	"status":{type: Number,default:1},
	"createddate": { type: Date, default: Date.now }
});
module.exports = mongoose.model('Banner', bannerSchema, 'Banner')



