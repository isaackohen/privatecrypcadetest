var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var providerSchema = new Schema({
	"image":{ type: String,default:""},
	"name":{ type: String,default:""},
	"status":{type: Number,default:1},
	"createddate": { type: Date, default: Date.now }
});
module.exports = mongoose.model('Providers', providerSchema, 'Providers')



