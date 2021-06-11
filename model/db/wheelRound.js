var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var autoIncrement = require('mongoose-auto-increment');


var circleRoundSchema = new Schema({
    "level":{type: String,default:""},
    "roundId":{type: Number,default:1000},
    "levelIndex":{ type: String,default:""},
	"secretKey":{ type: String,default:""},
	"hash":{ type: String,default:""},
    "createddate": { type: Date, default: Date.now }
});

autoIncrement.initialize(mongoose.connection);	
circleRoundSchema.plugin(autoIncrement.plugin, {
    model: 'CircleRound',
    field: 'roundId',
    startAt: 1000,
    incrementBy: 1
});
module.exports = mongoose.model('CircleRound', circleRoundSchema, 'CircleRound')
