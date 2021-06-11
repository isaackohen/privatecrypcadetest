var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var clientsSchema = new Schema({
	"image":{ type: String,default:""},
	"status":{type: Number,default:1},
	"createddate": { type: Date, default: Date.now }
});
module.exports = mongoose.model('Clients', clientsSchema, 'Clients')



