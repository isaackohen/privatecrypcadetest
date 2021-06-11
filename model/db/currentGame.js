/* Latest dice game */
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

var gameSchema = new Schema({
    "user_id": { type: String, require: true, unique: true },
    "game": { type: String, require: true },
    "luckyNumber": { type: Number, require: true }, // TODO specify max/min
    "secretKey": { type: String, require: true }, // TODO specify length
    'hash': { type: String, require: true } // TODO specify length
}, {
    timestamps: true
});
module.exports = mongoose.model('currentGame', gameSchema, 'currentGame')