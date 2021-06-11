var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var depositScema = new Schema({
  "userId": { type: String},
  "linkedAddress":{type: String},
  "currency": { type:String},
  "amount": {type : Number, default : 0},
  "txnid": {type : String, default : ''},
  "status": { type: Number, default: 0 },
  "coldWalletStatus": { type: Number, default: 0 },
  "createddate": { type: Date, default: Date.now }
});
module.exports = mongoose.model('Deposit', depositScema, 'Deposit');
