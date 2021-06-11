const express      = require('express')
const mongoose       = require('mongoose');
const router       = express.Router();
const referalContent    = require('../model/db/gaugeContent');
const async          = require('async');
let common         = require('../helpers/common');


router.get('/get_referalContent',common.whitelistMiddleware, async function(req, res){
	try{
		var referalData = await referalContent.find();
		res.json({status:true,data:referalData});
	}
	catch(e){
		res.json({ status : false});
		console.log('get_referalContent',e)
	}
});


router.post('/add_referal', common.whitelistMiddleware,async function(req,res){
	var data = req.body;
	try{
		var updatereferal = await referalContent.update({_id:data._id},{$set:data});
		if(updatereferal){
			res.json({status:true,message:'Updated Successfully!'});
		} else {
			res.json({status:false,message:'Unable to Update'});
		}
	}
	catch(e){
		res.json({ status : false});
		console.log('add_referal',e)
	}
})



module.exports = router;