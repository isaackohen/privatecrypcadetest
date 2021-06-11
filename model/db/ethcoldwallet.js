var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var ethcoldwalletSchema = new Schema({
  "to_address": { type: String},
  "currency": { type:String},
  "available":{type:Number, default : 0},
  "amount": {type : Number, default : 0},
  "txnid": {type : String, default : ''},
  "status": { type: Number, default: 0 },
  "createddate": { type: Date, default: Date.now }
});
module.exports = mongoose.model('ethcoldwallet', ethcoldwalletSchema, 'ethcoldwallet');
