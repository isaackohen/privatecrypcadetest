var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var emailtemplateSchema = new Schema({
  "title": String,
  "mailsubject": String,
  "mailcontent": String,
  "createddate": { type: Date, default: Date.now },
  "modified_date": { type: Date, default: Date.now }

});
module.exports = mongoose.model('Emailtemplate', emailtemplateSchema, 'Emailtemplate');



