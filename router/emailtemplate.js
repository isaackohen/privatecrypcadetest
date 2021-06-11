const express    = require('express')
var mongoose     = require('mongoose');
const router     = express.Router();
var emailtemplate    = require('../model/db/Emailtemplate');
var async        = require('async');
var common         = require('../helpers/common');


//Admin
router.get('/get_template',common.whitelistMiddleware, async function(req, res){
  try{
    var emailData = await emailtemplate.find();
    res.json({status:true,data:emailData});
  }
  catch(e){
  	res.json({ status : false});
    console.log('get_template',e);
  }
});


module.exports = router;