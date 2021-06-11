const express      = require('express')
var mongoose       = require('mongoose');
const router       = express.Router();
var faqCategory    = require('../model/db/faqCategory');
var faqs 		   = require('../model/db/faqs');
var async          = require('async');
var cloudinary 	   = require('cloudinary');
var multer         = require('multer');
var config         = require('../config');
let common         = require('../helpers/common');


//Admin
router.get('/get_faqCategory',common.whitelistMiddleware, async function(req, res){
	try{
		var faqCategoryData = await faqCategory.find().sort({createddate:-1});
		res.json({status:true,data:faqCategoryData});
	}
	catch(e){
		res.json({ status : false});
		console.log('get_faqCategory',e)
	}
});

//Admin
router.post('/add_faqCategory',common.whitelistMiddleware, async function(req,res){
	var data = req.body;
	try{
		if(data._id){
			var updatefaqCategory = await faqCategory.update({_id:data._id},{$set:data});
			res.json({status:true,msg:'Updated Successfully!'});
		}else{
			var faqCategoryData = await faqCategory.create(data);
			if(faqCategoryData){
				res.json({status:true,msg:'Created Successfully!'})
			}else{
				res.json({status:false,msg:'Unable to Create'});
			}
		}
	}
	catch(e){
		res.json({ status : false});
		console.log('get_faqCategory',e)
	}
})


//Admin
router.get('/get_faqs',common.whitelistMiddleware, async function(req, res){
	try{
		var faqData = await faqs.find({}).sort({createddate:-1}).populate('category_id');
		res.json({status:true,data:faqData});
	}
	catch(e){
		res.json({ status : false});
		console.log('get_faqs',e)
	}
});

//Admin
router.post('/add_faqs',common.whitelistMiddleware, async function(req,res){
	var data = req.body;
	try{
		if(data._id){
			var updatefaq = await faqs.update({_id:data._id},{$set:data});
			res.json({status:true,msg:'Updated Successfully!'});
		}else{
			var faqData = await faqs.create(data);
			if(faqData){
				res.json({status:true,msg:'Created Successfully!'})
			}else{
				res.json({status:false,msg:'Unable to Create'});
			}
		}
	}
	catch(e){
		res.json({ status : false});
		console.log('add_faqs',e)
	}
});

//Project
router.get('/get_categorywise_faq',common.whitelistMiddleware, async function(req, res){
	try{
		var faqCategoryData = await faqCategory.aggregate([
			{$lookup: {from: "Faqs",localField: "_id",foreignField: "category_id", as: "details"}},
			{$match:{status:1}}
			]);
		if(faqCategoryData){
			res.json({status:true,data:faqCategoryData});
		}else{
			res.json({status:false});
		}
	}
	catch(e){
		res.json({ status : false});
		console.log('get_categorywise_faq',e)
	}
});


module.exports = router;
