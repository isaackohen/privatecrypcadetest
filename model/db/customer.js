var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var userSchema = new Schema({
  user_id : { type: String},
  invitedBy:{type:String, default: ''},
  invitedCount:{type:Number, default: 0},
  referal_cade: {type:Number,default: 0},
  pool_amount: {type:Number, default: 0},
  withdraw_count: {type:Number, default: 0},
  withdraw_amount: {type:Number, default: '0'},
  eth_withdraw_count: {type:Number, default: 0},
  eth_withdraw_amount: {type:Number, default: '0'},
  matic_withdraw_count: {type:Number, default: 0},
  matic_withdraw_amount: {type:Number, default: '0'},
  user_name: {type: String, default: ''},
  user_image: {type: String, default: ''},
  rank: {type: Number, default: 1},
  rankName: {type: String, default: ''},
  multipliers: [{
    value: {
      type: Number,
      default: 0,
    },
    appliedOn: {
      type: Date,
      default: null,
    },
    active: {
      type: Boolean,
      default: false,
    },
    minedTokens: {
      type: Number,
      default: 0,
    },
  }],
  createddate: { type: Date, default: Date.now }
});
module.exports = mongoose.model('Users', userSchema, 'Users')
