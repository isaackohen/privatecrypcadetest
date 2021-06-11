var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var rankuserTypeSchema = new Schema({
	"type":{type: String,default:""},
	"status":{type: Number,default:1},
	"createddate": { type: Date, default: Date.now },
});
module.exports = mongoose.model('RankUser', rankuserTypeSchema, 'RankUser');



