var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var shareSchema = new Schema({
	"userid":{ type: String,default:""},
	"game":{ type: String,default:""},
	"betamount":{ type: Number,default:""},
	"shared_percentage":{type:Number,default:0},
	"shared_amount":{type:Number,default:0},
	"status":{type:Number,default:0},
	"createddate": { type: Date, default: Date.now }
});
module.exports = mongoose.model('Platishare', shareSchema, 'Platishare')



