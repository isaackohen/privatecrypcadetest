var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var ipmanagementSchema = new Schema({
    "ip":{type:String,default:""},
    "status":{type:Number,default:1},
    "createddate": { type: Date, default: Date.now }
});
module.exports = mongoose.model('ipmanagement', ipmanagementSchema, 'ipmanagement')
