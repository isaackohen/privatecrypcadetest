var mongoose = require('mongoose');
var Schema = mongoose.Schema;
const currencyCodes = require('../../constants/currencyCodes')

var diceSchema = new Schema({
	"prediction":{ type: Number,default:""},
	"luckyNumber":{ type: String,default:""},
	"secretKey":{ type: String,default:""},
	"hash":{ type: String,default:""},
	"betAmount":{ type: Number,default:""},
	"rollStatus":{ type: String,default:""},
	"multiplier":{ type: String,default:""},
	"payout":{type: Number,default:1},
	"userId":{type: String,default:''},
	"status":{type: Number,default:1},
	"balBeforeBet":{type: Number},
	"balAfterBet":{type: Number},
	"cstatus":{type: Number,default:1},
	"luckgen":{type:Number, default:0},
	"rank":{type:Number, default:0},
	"createddate": { type: Date, default: Date.now },
	"currency": { type: String }
});

module.exports = mongoose.model('Dice', diceSchema, 'Dice')
