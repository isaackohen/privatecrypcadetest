const express      = require('express')
var mongoose       = require('mongoose');
const router       = express.Router();
var banner    = require('../model/db/banner');
var adbanner    = require('../model/db/adbanner');
var async          = require('async');
let common         = require('../helpers/common');

//Admin
router.get('/get_banner',common.whitelistMiddleware,  async function(req, res){
	try{
		var bannerData = await banner.find();
		res.json({status:true,data:bannerData});
	}
	catch(e){
		res.json({ status : false});
		console.log('get_banner',e)
	}
});

router.get('/get_banners',common.whitelistMiddleware,  async function(req, res){
	try{
		var bannerData = await banner.find({status:1});
		res.json({status:true,data:bannerData});
	}
	catch(e){
		res.json({ status : false});
		console.log('get_banners',e)
	}
});

router.get('/get_adbanners',common.whitelistMiddleware,  async function(req, res){
	try{
		var bannerData = await adbanner.find({status:1});
		console.log("sjdhjshdjsh",bannerData)
		res.json({status:true,data:bannerData});
	}
	catch(e){
		res.json({ status : false});
		console.log('get_adbanners',e)
	}
});

//Admin
router.post('/add_banner',common.whitelistMiddleware,  async function(req,res){
	var data = req.body;
	try{
		if(data._id){
			var updateBanner = await banner.update({_id:data._id},{$set:data});
			res.json({status:true,msg:'Updated Successfully!'});
		}else{
			var bannerData = await banner.create(data);
			if(bannerData){
				res.json({status:true,msg:'Created Successfully!'})
			}else{
				res.json({status:false,msg:'Unable to Create'});
			}
		}
	}
	catch(e){
		res.json({ status : false});
		console.log('add_banner',e)
	}
})


module.exports = router;