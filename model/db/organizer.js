var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var adminSchema = new Schema({
    "admin_name":{type: String,default:""},
    "admin_emailid":{type: String,default:""},
    "admin_password":{type: String,default:""},
    "admin_pattern":{type: Number,default: 123},
    "admin_image":{type: String, default: ''},
    "reset_password":{type: Number,default:0},
    "failed":{type: Number,default:0},
    "failed_otp":{type: String, default: ''},
    "set_password":{type: Number,default:0},
    "reset_password_timer":{type: Date,default: Date.now},
    "reset_otp_timer":{type: Date,default: Date.now},
    "createddate": { type: Date, default: Date.now },
    "modifieddate":{ type: Date, default: Date.now }
});
module.exports = mongoose.model('admin', adminSchema, 'admin')
