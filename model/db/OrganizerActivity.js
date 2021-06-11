var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var cmsSchema = new Schema({
	"user_id"   : {type:String},
	"ip"   : {type:String},
	"location"   : {type:String},
	"browser"   : {type:String},
	"type"   : {type:String},
	"os"   : {type:String},
	"datetime"   : {type: Date, default: Date.now},
});
module.exports = mongoose.model('AdminActivity', cmsSchema, 'AdminActivity')