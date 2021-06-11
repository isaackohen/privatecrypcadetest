const express      = require('express')
var mongoose       = require('mongoose');
const router       = express.Router();
var news           = require('../model/db/news');
var async          = require('async');
let common         = require('../helpers/common');


//Admin
router.get('/get_news',common.whitelistMiddleware, async function(req, res){
	try{
		var newsData = await news.find();
		res.json({status:true,data:newsData});
	}
	catch(e){
		res.json({ status : false});
		console.log('get_news',e)
	}
});

//Admin
router.post('/add_news', common.whitelistMiddleware,async function(req,res){
	var data = req.body;
	try{
		if(data._id){
			var updatenews = await news.update({_id:data._id},{$set:data});
			res.json({status:true,msg:'Updated Successfully!'});
		}else{
			var newsData = await news.create(data);
			if(newsData){
				res.json({status:true,msg:'Created Successfully!'})
			}else{
				res.json({status:false,msg:'Unable to Create'});
			}
		}
	}
	catch(e){
		res.json({ status : false});
		console.log('add_news',e)
	}
});


//Project
router.get('/Newslist',common.whitelistMiddleware, async function(req, res){
	try{
		var newsData = await news.find({status:1}).sort({_id:-1});
		res.json({status:true,data:newsData});
	}
	catch(e){
		res.json({ status : false});
		console.log('Newslist',e)
	}
});

//Project
router.post('/get_newsOne',common.whitelistMiddleware, async function(req, res){
	try{
		var newsoneData = await news.findOne({_id:req.body._id,status:1});
		res.json({status:true,data:newsoneData});
	}
	catch(e){
		res.json({ status : false});
		console.log('get_newsOne',e)
	}
});


module.exports = router;