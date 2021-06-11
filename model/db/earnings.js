var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var earningSchema = new Schema({
  "initial_amount": { type: String},
  "user_share": { type:String, default:0},
  "winner_share": { type:String, default:0},
  "wager_share": { type:String, default:0},
  "admin_share": {type : String, default : 0},
  "team_share": {type : String, default : ''},
  "user_percent": { type:String, default:0},
  "admin_percent": {type : String, default : 0},
  "team_percent": {type : String, default : 0},
  "final_amount": { type: String },
  "currency":{type:String, default:''},
  "createddate": { type: Date, default: Date.now }
});
module.exports = mongoose.model('Earning', earningSchema, 'Earning');
