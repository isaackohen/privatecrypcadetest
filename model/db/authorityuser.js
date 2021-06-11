var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var usermanagementSchema = new Schema({
    "user_address":{type:String,default:""},
    "status":{type:Number,default:1},
    "createddate": { type: Date, default: Date.now }
});
module.exports = mongoose.model('usermanagement', usermanagementSchema, 'usermanagement')
