const express      = require('express')
var mongoose       = require('mongoose');
const router       = express.Router();
var circle    	   = require('../model/db/wheel');
var circlebet      = require('../model/db/wheelbet');
var current_game   = require("../model/db/currentGame");
var diviSettings    = require('../model/db/rewardSettings');


var circleSettings = require('../model/db/wheelSettings');
var async          = require('async');
var app 		   = express();
// var socket         = require('../helpers/socket').listen(app);
var common         = require('../helpers/common');
var circleRound	   = require('../model/db/wheelRound');
var wallet 		   = require('../model/db/wallet');
const currentGame      = require('../model/db/currentGame');
var shareTbl       = require('../model/db/share');


router.get('/get_circle',common.whitelistMiddleware, async function(req, res){
	try{
		var circleData = await circle.find().sort({_id:-1}).limit(40);
		res.json({status:true,data:circleData});
	}
	catch(e){
		res.json({ status : false});
		console.log('get_circle',e)
	}
});

router.get('/get_all_circle',common.whitelistMiddleware, async function(req, res){
	try{
		var circleData = await circle.find().sort({_id:-1});
		res.json({status:true,data:circleData});
	}
	catch(e){
		res.json({ status : false});
		console.log('get_circle',e)
	}
});

router.get('/getCurrentList',common.whitelistMiddleware, async function(req,res){
	try{
		let getRoundId = await currentGame.findOne({game:'circle'}).lean();
		let getcircleList = await circle.aggregate([
			{
			 $match:
			 {roundId:parseInt(getRoundId.user_id)}
		   },
		   {
			 $lookup:{
			   from: "Users",
			   localField: "userId",
			   foreignField: "user_id",
			   as: "user_docs"
			 }
		   },
		   {   $unwind:"$user_docs" }

	 ]);
		res.json({status:true,data:getcircleList});
	}catch(e){
		res.json({ status : false});
		console.log('getCurrentList',e)
	}
})


router.post('/add_circle',common.tokenMiddleware, async function(req,res){
	var data = req.body;
	try{
		if(data._id){
			res.json({status:true,msg:'Updated Successfully!'});
			//emit timerOn socket
		}else{
			var circleData = await circle.create(data);
			if(circleData){
				var listdata = await list(circleData);
				io.emit('circleList',listdata);
				res.json({status:true})
			}else{
				res.json({status:false,msg:'Unable to Create'});
			}
		}
	}
	catch(e){
		res.json({ status : false});
		console.log('add_circle',e)
	}
});

router.post("/getHashRound", common.tokenMiddleware, async function(req, res) {
    try {
		var circleData = await current_game.findOne({game:'circle'}).lean();
		let available = {
			hash: circleData.hash
		  }
        res.json({ status: true,data:available });
    } catch (error) {
        res.json({ status: false, error });
    }
});

router.get('/circle_listByProfit',common.whitelistMiddleware, async function(req,res){
	var data = req.body;
	try{
			let diceData = await circle.aggregate([
				{
				 $match:
				 {status:1}
			   },
			   { $sort : {payout:-1} },
			   {
				 $lookup:{
				   from: "Users",
				   localField: "userId",
				   foreignField: "user_id",
				   as: "user_info"
				 }
			   },
			   {   $unwind:"$user_info" }

		 ]);
		// var diceData = await circle.find({status:1}).sort({payout:-1});
		if(diceData){
			res.json({status:true,data:diceData})
		}else{
			res.json({status:false,msg:'Unable to get list'});
		}
	}
	catch(e){
		res.json({ status : false});
		console.log('circle_listByProfit',e)
	}
});

router.get('/roundList',common.whitelistMiddleware,async function(req,res){
	var circleRoundList = await circle.aggregate([{$match:{status:1}},{$group:{_id:"$roundId",level:{"$first":"$level"}}}]);
	res.json({status:true, data:circleRoundList});
})


router.post('/shareCircle', common.tokenMiddleware,async function(req, res){
	var data = req.body;
	let arrayId = [];
	let amountUpdate = 0;
	var divisett = await diviSettings.findOne().lean();
	for(let i=0;i<data.list.length;i++){
		arrayId.push(data.list[i]._id);
		// let createShare = await share.create(obj);
	}

	var updateCircle = await circle.update({_id:{$in:arrayId}},{$set:{status:1}},{multi:true});
	let alldata= await common.allWinnerdata();
    io.emit("allGameData",alldata);
	res.json({status:true})
});

function now() {
    return Date.now();
}

router.post('/shareInsert', common.tokenMiddleware,async function(req, res){
	let data = req.body;
	let amountUpdate = 0;
	let shareData = [];
	var divisett = await diviSettings.findOne().lean();
	for(let i=0;i<data.list.length;i++){
		var profit_upd   =  parseFloat(data.list[i].payout);
		amountUpdate = amountUpdate + profit_upd;
		shareData.push({
			userid:data.list[i].userId,
			game:"Circle",
			betamount:parseFloat(data.list[i].betAmount),
			win:1,
			real_org:parseFloat(divisett.pool_amount),
			fake_org:parseFloat(divisett.fake_pool_amount),
			in_amt:0,
			out_amt:parseFloat(data.list[i].payout),
			real_mod:parseFloat(divisett.pool_amount) - parseFloat(data.list[i].payout),
			fake_mod:parseFloat(divisett.fake_pool_amount) - parseFloat(data.list[i].payout),
			shared_percentage:0,
			shared_amount:0
		});
		// let createShare = await share.create(obj);
	}
	console.log(shareData,'----------------------------------shareDatinsertmanyyyy')
	if(shareData.length > 0){
		let createShare = await shareTbl.insertMany(shareData);
	}
	var updated_pool =  parseFloat(divisett.pool_amount)-parseFloat(amountUpdate);
	var update_fake_pool =  parseFloat(divisett.fake_pool_amount)-parseFloat(amountUpdate);
	let updatedivi = await diviSettings.updateOne({_id:divisett._id},{$set:{pool_amount:updated_pool,fake_pool_amount:update_fake_pool}});
	res.json({status:true});
})

// async function updateWallet(items){
router.post('/balUpdate',common.whitelistMiddleware,async function(req,res){
	let data = req.body;
	let bulkOperatorWallet  = wallet.collection.initializeUnorderedBulkOp();
	let currentGameData = await currentGame.findOne({game:'circle'}).lean();
	try{
		if(data.balUpdate && data.balUpdate.length > 0){
			if(currentGameData && currentGameData.user_id === data.balUpdate[0].roundId){
				for(let i=0; i<data.balUpdate.length;i++){
					bulkOperatorWallet.find({user_id:data.balUpdate[i].userId}).update({$inc:{"trx_wallet.amount":data.balUpdate[i].payout * 1000000}});
				}
				if(bulkOperatorWallet && bulkOperatorWallet.length > 0){
					await bulkOperatorWallet.execute();
					let userBalance = await wallet.findOne({user_id:data.balUpdate[0].userId}).lean();
					let usbal = userBalance.trx_wallet.amount/1000000;
					io.emit('getBal', {
						balance: usbal,
						address: data.balUpdate[0].userId,
						// TODO: Remove hardcoded value when this function will support multi currency
						currency: 'TRX',
					});

				}
			}
			res.json({status:true});
		}else{
			res.json({status:false});
		}

	}catch(e){
		console.log(e,'balUpdate')
		res.json(e);
	}

})


router.post('/circle_list',common.tokenMiddleware, async function(req,res){
	var data = req.body;
	try{
		var circleData = await circle.find({userId:data.userId}).sort({_id:-1}).limit(40);
		if(circleData){
			res.json({status:true,data:circleData})
		}else{
			res.json({status:false,msg:'Unable to get list'});
		}
	}
	catch(e){
		res.json({ status : false});
		console.log('circle_list',e)
	}
});


router.post('/circle_userlist',common.tokenMiddleware, async function(req,res){
	var data = req.body;
	try{
		let pageNo = data.pageNo;
      let size = parseInt(data.size);
      console.log(pageNo,size)
      if(pageNo >0 && size > 0) {
        let skips= size * (pageNo - 1);
        let limits = size;
        let totalCount= await circle.find({userId:data.userId}).count();
		var circleData = await circle.find({userId:data.userId}).skip(skips).limit(limits).sort({_id:-1});
		if(circleData){
			res.json({status:true,data:circleData,count:totalCount})
		}else{
			re/s.json({status:false,msg:'Unable to get list'});
		}
	}else{
		res.json({status:false,"message": "Error fetching data"})
	}
	}catch(e){
		res.json({ status : false});
		console.log('circle_list',e)
	}
});


async function list(data){
	var circleList = await circle.findOne({_id:data._id});
	return circleList;
}

router.get('/roundLists',common.tokenMiddleware, async function(req,res){
	var data = req.body;
	try{
		var roundList = await circleRound.find().sort({_id:-1}).limit(41);
		roundList.shift();
		res.json({status:true,data:roundList});
	}catch(e){
		res.json({ status : false});
		console.log('add_roundList',e);
	}
});

router.get('/allRoundLists',common.tokenMiddleware, async function(req,res){
	var data = req.body;
	try{
		var roundList = await circleRound.find().sort({_id:-1}).limit(30);
		roundList.shift();
		res.json({status:true,data:roundList});
	}catch(e){
		res.json({ status : false});
		console.log('add_roundList',e);
	}
});

router.post('/getRoundData',common.tokenMiddleware, async function(req,res){
	var data = req.body;
	try{
		var roundList = await circleRound.findOne({roundId:data.roundId});
		res.json({status:true,data:roundList});
	}catch(e){
		res.json({ status : false});
		console.log('getRoundData',e);
	}
});


// var listByRound = await circle.aggregate([{$group : { _id : "$roundId", createddate:{"$first":"$createddate"}, roundData: { $push: "$$ROOT" } }
router.post('/getListByRound',common.tokenMiddleware, async function(req,res){
	try{
		let list = await circle.aggregate([
			{
			 $match:
			 {roundId:req.body.roundId}
		   },
		   {
			 $lookup:{
			   from: "Users",
			   localField: "userId",
			   foreignField: "user_id",
			   as: "user_info"
			 }
		   },
		   {   $unwind:"$user_info" }

	 ]);
		// var list = await circle.find({roundId:req.body.roundId});
		res.json({status:true,data:list})

	}catch(e){
		res.json({ status : false});
		console.log('getListByRound',e);
	}
})

module.exports = router;

