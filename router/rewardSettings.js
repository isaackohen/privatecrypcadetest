const express      	= require('express')
var mongoose       	= require('mongoose');
const router       	= express.Router();
var diviSettings    = require('../model/db/rewardSettings');
var dividendPool    = require('../model/db/reward');
var async          	= require('async');
var common         = require('../helpers/common');


//Admin
router.get('/get_diviSetting',common.whitelistMiddleware, async function(req, res){
	try{
		var diviData = await diviSettings.findOne();
		res.json({status:true,data:diviData});
	}
	catch(e){
		res.json({ status : false});
		console.log('get_diviSetting',e)
	}
});


router.get('/get_diviSettings',common.whitelistMiddleware, async function(req, res){
	try{
		var diviData = await diviSettings.findOne();
		let dataSetting = {
			slot_cade:diviData.slot_cade,
			inhouse_cade:diviData.inhouse_cade,
			slot_cade_eth:diviData.slot_cade_eth,
			inhouse_cade_eth:diviData.inhouse_cade_eth,
			slot_cade_matic:diviData.slot_cade_matic,
			inhouse_cade_matic:diviData.inhouse_cade_matic,
			min_freezeAmount:diviData.min_freezeAmount,
			pool_amount:diviData.fake_pool_amount,
			eth_pool_amount:diviData.eth_fake_pool_amount,
			matic_pool_amount:diviData.matic_fake_pool_amount,
			description:diviData.description,
			user_multiplier_mining_limit: diviData.user_multiplier_mining_limit,
		}
		res.json({status:true,data:dataSetting});
	}
	catch(e){
		res.json({ status : false});
		console.log('get_diviSetting',e)
	}
});

router.get('/get_unremmed',common.whitelistMiddleware, async function(req, res){
	try{
		var totalData = await dividendPool.aggregate([ { $match: {expiry_status:0} },{$group:{_id:null,amount:{$sum:"$distributed_amount"}}}]);
		if(totalData[0] && totalData[0].amount)
      	{
        	var total_amt = totalData[0].amount;
      	}else{
        	var total_amt = 0;
      	}
      	res.json({status:true,data:total_amt});
	}
	catch(e){
		res.json({ status : false});
		console.log('get_unremmed',e)
	}

});


router.get('/get_unremmedlist',common.whitelistMiddleware, async function(req, res){
	try{

		var totalData = await dividendPool.aggregate([ { $match: {expiry_status:0} },{$group:{_id:"$userId",amount:{$sum:"$distributed_amount"}}}]);
      	res.json({status:true,data:totalData});
	}
	catch(e){
		res.json({ status : false});
		console.log('get_unremmed',e)
	}

});


router.post('/edit_diviSetting',common.whitelistMiddleware, async function(req, res) {
	try{
		let update = await diviSettings.updateOne({_id:req.body._id},{ $set:req.body});
		let diviUpdated = await diviSettings.findOne({_id:req.body._id});
		if(update){
			io.emit('getdivi',{'diviSettings':diviUpdated,'profit':'','address':''});
			res.json({ status: true,message:"Success" });
		}
		else{
			res.json({ status:false });
		}
	}
	catch(e){
		res.json({ status : false});
		console.log('edit_diviSetting',e)
	}
});
router.get('/get_dividendlist',common.whitelistMiddleware, async function(req, res){
	try{

		var poolData = await dividendPool.find().sort({createddate:-1});
      	res.json({status:true,data:poolData});
	}
	catch(e){
		res.json({ status : false});
		console.log('get_unremmed',e)
	}

});

router.get('/get_unremmedlist',common.whitelistMiddleware, async function(req, res){
	try{

		var totalData = await dividendPool.aggregate([ { $match: {expiry_status:0} },{$group:{_id:"$userId",amount:{$sum:"$distributed_amount"}}}]);
      	res.json({status:true,data:totalData});
	}
	catch(e){
		res.json({ status : false});
		console.log('get_unremmed',e)
	}

});

module.exports = router;
