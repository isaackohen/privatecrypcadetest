const express        = require('express')
const router       	 = express.Router();
const async          = require('async');
const mongoose       = require('mongoose');
const monopoly    	 = require('../model/db/monopoly');
const createroom     = require('../model/db/createroom');
var common         = require('../helpers/common');


//Admin
router.get('/get_monopoly',common.whitelistMiddleware, async function(req, res){
	try{
		var monopolyData = await monopoly.find();
		res.json({status:true,data:monopolyData});
	}
	catch(e){
		  res.json({ status : false});
		console.log('get_circle',e)
	}
});


//Admin
router.post('/add_monopoly',common.whitelistMiddleware, async function(req,res){
	var data = req.body;
	try{
		var updatemonopoly = await monopoly.update({_id:data._id},{$set:data});
		if(updatemonopoly){
		res.json({status:true,msg:'Updated Successfully!'});
		}else{
			res.json({status:false,msg:'Unable to Create'});
		}
	}
	catch(e){
		 res.json({ status : false});
		console.log('add_news',e)
	}
});


//Admin
router.get('/get_room',common.whitelistMiddleware, async function(req, res){
	try{
		var roomData = await createroom.find().sort({_id:-1});
		res.json({status:true,data:roomData});
	}
	catch(e){
		 res.json({ status : false});
		console.log('get_circle',e)
	}
});


//Admin
router.post('/add_room',common.whitelistMiddleware, async function(req,res){
	var data = req.body;
	try{
		if(data._id){
			var updateroom = await createroom.update({_id:data._id},{$set:data});
			if(updateroom){
				res.json({status:true,msg:'Updated Successfully!'});
			} else{
				res.json({status:false,msg:'Error on updation'});
			}
		} else {
			var createnew = await createroom.create(data);
			if(createnew){
				res.json({status:true,msg:'Created Successfully!'})
			}else{
				res.json({status:false,msg:'Unable to Create'});
			}
		}
	}	
	catch(e){
		 res.json({ status : false});
		console.log('add_aboutus',e)
	}
});

router.get('/getRoom',common.whitelistMiddleware, async function(req, res){
	try{
		var roomData = await createroom.find({status:1}).sort({_id:-1}).limit(16);
		res.json({status:true,data:roomData});
	}
	catch(e){
		  	res.json({ status : false});

		console.log('get_circle',e)
	}
});

module.exports = router;