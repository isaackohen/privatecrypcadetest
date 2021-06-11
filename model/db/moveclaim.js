var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var claimSchema = new Schema({
  "userId": { type: String},
  "currency": { type:String},
  "amount": {type : Number, default : 0},
  "txnid": {type : String, default : ''},
  "status": { type: Number, default: 0 },
  "ip":{type:String, default: ''},
  "createddate": { type: Date, default: Date.now }
});
module.exports = mongoose.model('Claim', claimSchema, 'Claim');
