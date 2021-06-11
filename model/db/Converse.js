var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var chatSchema = new Schema({
	"game":{ type: Number, default: 1},
	"message":{ type: String,default:""},
	"sender_address":{ type: String,default:""},
	"favourite":[String],
	"createddate": { type: Date, default: Date.now }
});
module.exports = mongoose.model('Chat', chatSchema, 'Chat')
