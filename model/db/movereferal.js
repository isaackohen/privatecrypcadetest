var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var withdrawSchema = new Schema({
  "userId": { type: String},
  "currency": { type:String},
  "amount": {type : Number, default : 0},
  "status": { type: Number, default: 0 },
  "createddate": { type: Date, default: Date.now }
});
module.exports = mongoose.model('ReferalWithdraw', withdrawSchema, 'ReferalWithdraw');
