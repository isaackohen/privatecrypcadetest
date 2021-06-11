const express          = require('express')
var mongoose       	   = require('mongoose');
const router       	   = express.Router();
var rankingCategory    = require('../model/db/rankcategory');
var userRanking        = require('../model/db/rankuser');
var rankCombo 		   = require('../model/db/rankcombo');
var async          	   = require('async');
let common             = require('../helpers/common');

//Admin category
router.post('/addRankCategory',async function(req,res){
	let data = req.body;
	let createRankCategory = await rankingCategory.create(data);
	if(createRankCategory){
		res.json({status:true,msg:'Created Successfully'});
	}else{
		res.json({status:false, msg:'Unable to Create'});
	}
});

router.get('/getRankingCategory', async function(req,res){
	let getData = await rankingCategory.find().lean();
	if(getData){
		res.json({status:true,data:getData});
	}
});

//user's rank
router.post('/addRankUser',async function(req,res){
	let data = req.body;
	let createRankUser = await userRanking.create(data);
	if(createRankUser){
		res.json({status:true,msg:'Created Successfully'});
	}else{
		res.json({status:false, msg:'Unable to Create'});
	}
});

router.get('/getUserRank', async function(req,res){
	let getData = await userRanking.find().lean();
	if(getData){
		res.json({status:true,data:getData});
	}
});

//combination of both
router.post('/addRankCombo',async function(req,res){
	let data = req.body;
	let createRankCategory = await rankCombo.create(data);
	if(createRankCategory){
		res.json({status:true,msg:'Created Successfully'});
	}else{
		res.json({status:false, msg:'Unable to Create'});
	}
});

router.get('/getRankingCombo', async function(req,res){
	let getData = await rankCombo.find({}).populate('category').populate('userRank').lean();
	if(getData){
		res.json({status:true,data:getData});
	}
});

router.post('/addbulkcombo', async function(req,res){
	let data = req.body;
	let getData = await rankCombo.insertMany(data);
	if(getData){
		res.json({status:true,data:getData});
	}
});

module.exports = router;
