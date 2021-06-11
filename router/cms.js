const express      = require('express')
var mongoose       = require('mongoose');
const router       = express.Router();
var CMS    = require('../model/db/cms');
var faqs 		   = require('../model/db/faqs');
var async          = require('async');
let common         = require('../helpers/common');

//Admin
router.get('/get_cms',common.whitelistMiddleware, async function(req, res){
	try{
		var cmsData = await CMS.find();
		res.json({status:true,data:cmsData});
	}
	catch(e){
		res.json({ status : false});
		console.log('get_cms',e)
	}
});

//Admin
router.post('/add_cms',common.whitelistMiddleware, async function(req,res){
	var data = req.body;
	try{
		if(data._id){
			var updateCMS = await CMS.update({_id:data._id},{$set:data});
			res.json({status:true,msg:'Updated Successfully!'});
		}else{
			var cmsData = await CMS.create(data);
			if(cmsData){
				res.json({status:true,msg:'Created Successfully!'})
			}else{
				res.json({status:false,msg:'Unable to Create'});
			}
		}
	}
	catch(e){
		res.json({ status : false});
		console.log('add_cms',e)
	}
})

//Project
router.get('/get_faq',common.whitelistMiddleware, async function(req, res){
	try{
		var faqData = await CMS.find({heading:"FAQ"});
		res.json({status:true,data:faqData});
	}
	catch(e){
		res.json({ status : false});
		console.log('get_faq',e)
	}
});


module.exports = router;