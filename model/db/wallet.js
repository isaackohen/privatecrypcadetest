const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({
  "user_id" : { type: String, ref: 'Users' }, // trx address
  "trx_wallet" : {
    "currency": { type: String },
    "amount": { type: Number, default: 0 },
    "address": { type: String },
  },
  "eth_wallet": {
    "currency": { type: String },
    "amount": { type: Number, default: 0 },
    "address": { type: String },
  },
  "matic_wallet": {
    "currency": { type: String },
    "amount": { type: Number, default: 0 },
    "address": { type: String },
  }
});
module.exports = mongoose.model('UserWallet', walletSchema, 'UserWallet')