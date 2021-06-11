var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var moneyBackSchema = new Schema({
  "totalLoses": { type: Number, default: 0 },
  "totalWins": { type: Number, default: 0 },
  "cashBackAmount": { type: Number, default: 0 },
  "percentageAmount": { type: Number, default: 0 },
  "redeem": { type: Number, default: 0 },
  "timeOut": { type: Number, default: 0 },
  "expiryStatus": { type: Number, default: 0 },
  "userId":{ type: String,default:''},
  "createddate": { type: Date, default: Date.now },
  "update_date":{type:Date}
});
module.exports = mongoose.model('CashBack', moneyBackSchema, 'CashBack')



