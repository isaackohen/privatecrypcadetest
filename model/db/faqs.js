var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var faqSchema = new Schema({
	"category_id":{ type: mongoose.Schema.Types.ObjectId, ref: 'FaqCategory'},
	"heading":{type: String,default:""},
	"description":{type: String,default:""},
	"status":{type: Number,default:1},
	"createddate": { type: Date, default: Date.now }
});
module.exports = mongoose.model('Faqs', faqSchema, 'Faqs')



