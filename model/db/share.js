var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var shareSchema = new Schema({
	"userid":{ type: String,default:""},
	"game":{ type: String,default:""},
	"betamount":{ type: Number,default:""},
	"win":{ type: String,default:""},
	"real_org":{ type: String,default:""},
	"fake_org":{ type: String,default:""},
	"in_amt":{ type: String,default:""},
	"out_amt":{type: Number,default:1},
	"real_mod":{ type: String,default:""},
	"fake_mod":{ type: String,default:""},
	"shared_percentage":{type:Number,default:0},
	"shared_amount":{type:Number,default:0},
	"createddate": { type: Date, default: Date.now }
});
module.exports = mongoose.model('Share', shareSchema, 'Share')



