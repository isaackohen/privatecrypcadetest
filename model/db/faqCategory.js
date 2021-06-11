var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var faqCategorySchema = new Schema({
	"category":{type: String,default:""},
	"status":{type: Number,default:1},
	"createddate": { type: Date, default: Date.now },
});
module.exports = mongoose.model('FaqCategory', faqCategorySchema, 'FaqCategory')



