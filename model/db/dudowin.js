var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var dudowinSchema = new Schema({
	"prediction":{ type: String,default:""},
	"userId":{type: String,default:""},
	"betcount":{type: Number,default:1},
	"loss_count":{type: String, default:""},
	"createddate": { type: Date, default: Date.now }
});
module.exports = mongoose.model('Dudowin', dudowinSchema, 'Dudowin')



