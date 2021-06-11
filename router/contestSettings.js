const express      	= require('express')
var mongoose       	= require('mongoose');
const router       	= express.Router();
var diceSettings    = require('../model/db/dudoSettings');
var circleSettings  = require('../model/db/wheelSettings');
var circlecms  = require('../model/db/WheelCms');
var async          	= require('async');
var common         = require('../helpers/common');



//Admin
router.get('/get_diceSetting',common.whitelistMiddleware,async function(req, res){
	try{
		var diceData = await diceSettings.findOne();
		res.json({status:true,data:diceData});
	}
	catch(e){
		res.json({ status : false});
		console.log('get_diceSetting',e)
	}
});


//Admin
router.post('/edit_dicesetting',common.whitelistMiddleware, async function(req, res) {
	try{
		let Diceupdate = await diceSettings.updateOne({_id:req.body._id},{ $set:req.body})
		if(Diceupdate){
			var diceData = await diceSettings.findOne();
			io.emit('get_diceset',diceData);
			res.json({ status: true,message:"Success" });
		}
		else{
			res.json({ status:false });
		}						
	}
	catch(e){
		res.json({ status : false});
		console.log('edit_sitesetting',e)
	}
});

router.get('/get_circleSetting',common.whitelistMiddleware, async function(req,res){
	try{
		var circleData = await circleSettings.find();
		res.json({status:true,data:circleData});
	}
	catch(e){
		res.json({ status : false});
		console.log('get_circleSetting',e)
	}
})

router.get('/get_circleCms',common.whitelistMiddleware, async function(req,res){
	try{
		var circlecmsData = await circlecms.findOne();
		res.json({status:true,data:circlecmsData});
	}
	catch(e){
		res.json({ status : false});
		console.log('get_circleSetting',e)
	}
})

//Admin
router.post('/add_circleCms',common.whitelistMiddleware, async function(req,res){
	var data = req.body;
	try{
		if(data._id){
			var updatecircle = await circlecms.update({_id:data._id},{$set:data});
			res.json({status:true,msg:'Updated Successfully!'});
		}
	}
	catch(e){
		res.json({ status : false});
		console.log('add_news',e)
	}
});

//Admin
router.post('/add_circleSetting',common.whitelistMiddleware, async function(req,res){
	var data = req.body;
	try{
		if(data._id){
			var updatecircle = await circleSettings.update({_id:data._id},{$set:data});
			res.json({status:true,msg:'Updated Successfully!'});
		}else{
			var circleData = await circleSettings.create(data);
			if(circleData){
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

module.exports = router;