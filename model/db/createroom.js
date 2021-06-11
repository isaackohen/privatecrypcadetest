var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var createroomSchema = new Schema({
	"name":{ type: String,default:""},
	"playercount":{ type: Number,default:0},
	"betAmount":{ type: Number,default:0},
	"score":{ type: Number,default:0},
	"parkingfee":{type: Number,default:0},
	"starfee":{type: Number,default:0},
	"price":{type: Number,default:0},
	"fee":{type: Number,default:0},
	"status":{type: Number,default:1},
	"createddate": { type: Date, default: Date.now }
});

module.exports = mongoose.model('Createroom', createroomSchema, 'Createroom');
