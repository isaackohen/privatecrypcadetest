const express      	= require('express')
var mongoose       	= require('mongoose');
const router       	= express.Router();
var withSettings    = require('../model/db/moveSettings');
var async          	= require('async');
var common         = require('../helpers/common');


//Admin
router.get('/get_withSetting',common.whitelistMiddleware, async function(req, res){
	try{
		var withData = await withSettings.findOne();
		res.json({status:true,data:withData});
	}
	catch(e){
		res.json({ status : false});
		console.log('get_withSetting',e)
	}
});


router.post('/edit_withSetting',common.whitelistMiddleware, async function(req, res) {
	try{
		let update = await withSettings.updateOne({_id:req.body._id},{ $set:req.body})
		if(update){
			io.emit('get_withset',update);
			res.json({ status: true,message:"Success" });
		}
		else{
			res.json({ status:false });
		}						
	}
	catch(e){
		res.json({ status : false});
		console.log('edit_withSetting',e)
	}
});

module.exports = router;