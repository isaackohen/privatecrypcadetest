
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var battleShareSchema = new Schema({
	"userId":{ type: String,default:""},
	"type":{ type: String,default:""},
	"amount":{type:String, default:"" },
	"currency":{type:String, default:""},
	"createddate": { type: Date, default: Date.now }
});
module.exports = mongoose.model('BattleShare', battleShareSchema, 'BattleShare')



