const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const shopTransactionsSchema = new Schema({
	"userId": {type: String,default: ""},
	"price": {type: Number,default: 0},
	"currency": {type: String,default: ""},
	"amount": {type: Number,default:1},
	"multiplierApplied": { type: Number, default: 0}
}, {
	timestamps: {
		createdAt: 'created_at'
	},
});

module.exports = mongoose.model('ShopTransactions', shopTransactionsSchema, 'ShopTransactions')

