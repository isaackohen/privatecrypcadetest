const express      	= require('express')
var mongoose       	= require('mongoose');
const router       	= express.Router();
var slotSettings    = require('../model/db/externalSettings');
var async          	= require('async');
const common = require('../helpers/common');


//Admin
router.get('/get_slotSetting', common.whitelistMiddleware, async function(req, res){
	try{
		var slotData = await slotSettings.findOne();
		res.json({status:true,data:slotData});
	}
	catch(e){
		res.json({ status : false});
		console.log('get_diviSetting',e)
	}
});


router.post('/edit_slotSetting', common.whitelistMiddleware, async function(req, res) {
	try{
		let update = await slotSettings.updateOne({_id:req.body._id},{ $set:req.body})
		if(update){
			res.json({ status: true,msg:"Updated Successfully" });
		} else{
			res.json({ status:false });
		}						
	}
	catch(e){
		res.json({ status : false});
		console.log('edit_slotSetting',e)
	}
});


module.exports = router;