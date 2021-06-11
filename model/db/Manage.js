var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var tokenMiningSchema = new Schema({
  "userId" : { type: String},
  "Cad_token" : [{
    "type": { type: String}, 
    "amount": {type: Number, default: 0},
  }]
});
module.exports = mongoose.model('tokenMining', tokenMiningSchema, 'tokenMining')