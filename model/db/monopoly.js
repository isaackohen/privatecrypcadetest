var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var monopolySchema = new Schema({
	"betAmount":{ type: String,default:""},
	"score":{ type: String,default:""},
	"parkingfee":{type: String,default:""},
	"starfee":{type: String,default:""},
	"price":{type: Number,default:0},
	"fee":{type: Number,default:0},
	"Howtoplay":{type: String,default:""},
	"status":{type: Number,default:0},
	"createddate": { type: Date, default: Date.now }
});

module.exports = mongoose.model('Monopoly', monopolySchema, 'Monopoly')



