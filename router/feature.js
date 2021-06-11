const express      = require('express')
var mongoose       = require('mongoose');
const router       = express.Router();
var feature    = require('../model/db/Feature');
var async          = require('async');
let common         = require('../helpers/common');


router.get('/get_feature',common.whitelistMiddleware, async function(req, res){
	try{
		var referalData = await feature.find();
		res.json({status:true,data:referalData});
	}
	catch(e){
		res.json({ status : false});
		console.log('get_feature',e)
	}
});

router.post('/add_feature',common.whitelistMiddleware, async function(req,res){
	var data = req.body;
	try{
		var updatefeature = await feature.update({_id:data._id},{$set:data});
		if(updatefeature){
			res.json({status:true,message:'Updated Successfully!'});
		} else {
			res.json({status:false,message:'Unable to Update'});
		}
	}
	catch(e){
		 res.json({ status : false});
		console.log('add_feature',e)
	}
})

module.exports = router;