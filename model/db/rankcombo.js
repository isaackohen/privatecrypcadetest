var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var rankComboSchema = new Schema({
	"category":{ type: mongoose.Schema.Types.ObjectId, ref: 'RankCategory'},
	"userRank":{ type: mongoose.Schema.Types.ObjectId, ref: 'RankUser'},
	"combo":{type: String,default:''},
	"createddate": { type: Date, default: Date.now },
});
module.exports = mongoose.model('RankCombo', rankComboSchema, 'RankCombo');



