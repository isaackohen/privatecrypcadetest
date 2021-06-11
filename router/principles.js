const express      = require('express')
var mongoose       = require('mongoose');
const router       = express.Router();
var privacy    = require('../model/db/principles');
var terms    = require('../model/db/premise');
var async          = require('async');
var common         = require('../helpers/common');



router.get('/get_privacy',common.whitelistMiddleware, async function(req, res){
	try{
		var privacyData = await privacy.find();
		res.json({status:true,data:privacyData});
	}
	catch(e){
		res.json({ status : false});
		console.log('get_privacy',e)
	}
});


router.post('/add_privacy',common.whitelistMiddleware, async function(req,res){
	let data = req.body;
	console.log(data)
	try{
		if(data._id){
			var updateprivacy = await privacy.update({_id:data._id},{$set:data});
				res.json({status:true,message:'Updated Successfully!'});
		} else {
			var createprivacy = await privacy.create(data);
			if(createprivacy){
				res.json({status:true,message:'Created Successfully!'})
			}else{
				res.json({status:false,message:'Unable to Create'});
			}
		}
	}
	catch(e){
		res.json({ status : false});
		console.log('add_privacy',e)
	}
})


router.get('/get_allterms',common.whitelistMiddleware, async function(req, res){
	try{
		var alltermsData = await terms.find();
		res.json({status:true,data:alltermsData});
	}
	catch(e){
		res.json({ status : false});
		console.log('get_allterms',e)
	}
});

router.post('/get_terms',common.whitelistMiddleware, async function(req, res){
	let data=req.body;
	try{
		var termsData = await terms.find({type:data.type});
		res.json({status:true,data:termsData});
	}
	catch(e){
		res.json({ status : false});
		console.log('get_terms',e)
	}
});


router.post('/add_terms',common.whitelistMiddleware, async function(req,res){
	let data = req.body;
	console.log(data)
	try{
		if(data._id){
			var updateterms = await terms.update({_id:data._id},{$set:data});
				res.json({status:true,message:'Updated Successfully!'});
		} else {
			var createterms = await terms.create(data);
			if(createterms){
				res.json({status:true,message:'Created Successfully!'})
			}else{
				res.json({status:false,message:'Unable to Create'});
			}
		}
	}
	catch(e){
		res.json({ status : false});
		console.log('add_terms',e)
	}
})


router.get('/get_privacyList',common.whitelistMiddleware, async function(req, res){
	try{
		var privacyData = await privacy.find({status:1});
		res.json({status:true,data:privacyData});
	}
	catch(e){
		res.json({ status : false});
		console.log('get_privacy',e)
	}
});

router.post('/get_termsList',common.whitelistMiddleware, async function(req, res){
	let data = req.body;
	try{
		var alltermsData = await terms.find({type:data.type,status:1});
		res.json({status:true,data:alltermsData});
	}
	catch(e){
		res.json({ status : false});
		console.log('get_allterms',e)
	}
});

module.exports = router;