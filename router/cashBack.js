const express      = require('express')
var mongoose       = require('mongoose');
const router       = express.Router();
var cashBack       = require('../model/db/moneyBack');
var async          = require('async');
var common         = require('../helpers/common');
let dice 		   = require('../model/db/dudo');
let slots 		   = require('../model/db/external');
let userWallet     = require('../model/db/wallet');

router.post('/get_cashback',common.whitelistMiddleware, async function(req, res){
	let data = req.body;
	try{
		var cashBackData = await cashBack.find({userId:data.userId,expiryStatus:{$in: [2,3]}} );
		res.json({status:true,data:cashBackData});	
	}
	catch(e){
		res.json({ status : false});
		console.log('get_total',e)
	}
});

router.post('/get_usercashback', async function(req, res){
	let data = req.body;
	try{
		var cashBackData = await cashBack.findOne({userId:data.userId,expiryStatus:0});
		res.json({status:true,data:cashBackData});	
	}
	catch(e){
		res.json({ status : false});
		console.log('get_total',e)
	}
});

router.post('/get_userRedeem', async function(req, res){
	let data = req.body;
	try{
		var cashBackData = await cashBack.findOne({userId:data.userId,expiryStatus:1});
		res.json({status:true,data:cashBackData});	
	}
	catch(e){
		res.json({ status : false});
		console.log('get_total',e)
	}
});

//Adminlisting
router.post('/get_viewcashback',common.whitelistMiddleware, async function(req, res){
	let data = req.body;
	try{
		let pageNo = req.body.pageNo;
		let size = parseInt(req.body.size);
		let query={expiryStatus:{$in: [2,3]}};
		console.log(pageNo,size)
		if(pageNo >0 && size > 0) {
			let skips= size * (pageNo - 1);
			let limits = size;
			let search = req.body.search;
			let status = req.body.status;
			if(search){
				query={'userId': { $regex: '.*' + search + '.*',$options: 'i' }}
			}
			let totalCount= await cashBack.find(query).count();
			var cashBackData = await cashBack.find(query).skip(skips).limit(limits).sort({_id:-1}).lean();
			res.json({status:true,data:cashBackData,count:totalCount});	
		}else{
			res.json({status:false,"message": "Error fetching data"})
		}  
	}catch(e){
		res.json({ status : false});
		console.log('get_total',e)
	}
});

router.post('/create', async function(req,res){
	let data = req.body;
	try{
		let userSlotId = await userWallet.findOne({user_id:data.userId}).lean();
		let loseData = await calLoseWin('lose',data.userId,userSlotId._id,res);
		let winData = await calLoseWin('win',data.userId,userSlotId._id,res);
		data.totalLoses =  loseData;
		data.totalWins = winData;
		let cashBackImpl = data.totalLoses - data.totalWins;
		data.cashBackAmount = (cashBackImpl > 0)  ? cashBackImpl : 0;
		let alreadyExists = await cashBack.findOne({userId:data.userId,expiryStatus:0});
		if(alreadyExists){
			let updateRecord = await cashBack.update({userId:data.userId,expiryStatus:0},{$set:data});
			io.emit('cashbackData',data);
		}else{
			if(cashBackImpl > 0 || winData == 0 ){
				let createCashBack = await cashBack.create(data);
				if(createCashBack){
					io.emit('cashbackData',data);
					res.json({status:true,msg:'Created Successfully'});
				}else{
					res.json({status:false});
				}
			}else{
				res.json({status:false})
			}
			
		}
	}catch(e){
		res.json({status:false});
		console.log('create',e);
	}
});

async function calLoseWin(type,userId,slotUserId,res){
	  var today = new Date();
  	  var tdy_day = today.getDay();
  	  let daysToCal;
	  switch(tdy_day){
	    case 5:
	    daysToCal = 1;
	    break;
	    case 6:
	    daysToCal = 2;
	    break;
	    case 0:
	    daysToCal = 3;
	    break;
	    case 1:
	    daysToCal = 4;
	    break;
	    case 2:
	    daysToCal = 5;
	    break;
	    case 3:
	    daysToCal = 6;
	    break;
	    case 4:
	    daysToCal = 7;
	    break;
	  }
	  let utcHr;
	  if(daysToCal == 1){
		utcHr = today.getUTCHours();
	  }else{
		utcHr = 24
	  }
	//   let matchQuerySlot = {userid:slotUserId,trntype:"WIN",createddate:{$gt:new Date(Date.now() - 24*60*60 * 1000 * daysToCal)}};
	//   let matchQueryDice = {userId:userId,createddate:{$gt:new Date(Date.now() - 24*60*60 * 1000 * daysToCal)}};
	  let matchQuerySlot = {userid:slotUserId,rank: { $gte: 2 }};
	  let matchQueryDice = {userId:userId,createddate:{$gt:new Date(Date.now() - utcHr*60*60 * 1000 * daysToCal)},rank: { $gte: 2 }};
	  let amountReduction;
	  console.log(matchQuerySlot,'slllooottt')
	  if(type == 'lose'){
	  	matchQueryDice.status = 0;
		amountReduction = {$sum:"$betAmount"};
	  }else{
		matchQueryDice.status = 1;
		amountReduction = {$sum:{$subtract: [ "$payout", "$betAmount" ]}};
	  }
	  let diceData = await dice.aggregate([
	  	{$match:matchQueryDice},
	  	{$group:{_id:"$userId",betAmount:amountReduction}}
	  ]);
	  console.log(matchQueryDice,'dicematchquery')
	  let slotData = await slots.aggregate([
		{$match:matchQuerySlot},
		{ $addFields: { roundId: {$cond: [{ $eq: [ "$providerid", "2" ]}, "$remotetranid", "$roundid" ]} } },
		{$group:{_id:"$roundId", maxQuantity:  { $max: {$abs:{$convert:{input:"$amount",to: "double"}} } },items: {
			$push: {type:"$trntype",amount:"$amount"}
		  }}}
	  ]);
	  console.log(slotData,'sslllotttdddd')
	  if(slotData && slotData.length > 0){
		slotData[0].winData = 0;
		slotData[0].loseData = 0;
		for(let i=0; i<slotData.length; i++){
			slotData[i]['totalWin'] = 0;
			slotData[i]['totalLose'] = 0;
			for(let j=0; j<slotData[i].items.length; j++){
				slotData[i][slotData[i].items[j].type] = Math.abs(slotData[i].items[j].amount);
				if(parseFloat(slotData[i]['WIN']) != parseFloat(slotData[i]['BET'])){
					if(slotData[i]['WIN'] == slotData[i]['maxQuantity']){
						slotData[i]['totalWin'] = parseFloat(slotData[i]['WIN'] - slotData[i]['BET']);
					}else{
						if(slotData[i]['BET'] == parseFloat(slotData[i]['maxQuantity'])){
							slotData[i]['totalLose'] = parseFloat(slotData[i]['BET'] - (slotData[i]['WIN'] ? slotData[i]['WIN'] : 0));
						}
					}
				}else{
					slotData[i]['totalWin'] = 0;
					slotData[i]['totalLose'] = 0;
				}
			}
		}
		for(let i=0; i<slotData.length; i++){
			slotData[0].winData = slotData[i].totalWin +  slotData[0].winData;
			slotData[0].loseData = slotData[i].totalLose + slotData[0].loseData;
		}
	  }
	  let totalData;
	  let diceCalData = (diceData.length == 0) ? 0 : diceData[0].betAmount; 
	  let slotCalData = (slotData.length == 0) ? 0 : (type=='lose') ? slotData[0].loseData : slotData[0].winData;
	  if(diceData && diceData.length > 0 && slotData && slotData.length == 0 ){
		totalData = parseFloat(diceCalData);
	  }else if(slotData && slotData.length > 0 && diceData && diceData.length == 0){
		  totalData = parseFloat(slotCalData);
	  }else{
		totalData = parseFloat(diceCalData) + parseFloat(slotCalData);
	  }
	  return totalData;
}

module.exports = router;