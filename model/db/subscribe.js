var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var subscribeSchema = new Schema({
  "email": { type: String, default: '' },
  "status": { type: Number, default: 1 },
  "createddate": { type: Date, default: Date.now },
  "modified_date": { type: Date, default: Date.now }
});
module.exports = mongoose.model('Subscription', subscribeSchema, 'Subscription')



