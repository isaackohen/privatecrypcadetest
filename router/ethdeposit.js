const express      = require('express')
var mongoose       = require('mongoose');
const router       = express.Router();
var ethdeposit     = require('../model/db/deposit');
var async          = require('async');
var common         = require('../helpers/common');

//Admin
router.get('/get_total',common.whitelistMiddleware, async function(req, res){
	try{
		var totalData = await ethdeposit.aggregate([ { $match: {status:1,currency:"ETH"} },{$group:{_id:null,amount:{$sum:"$amount"}}}]);
		res.json({status:true,data:totalData[0].amount});	
	}
	catch(e){
		res.json({ status : false});
		console.log('get_total',e)
	}
});

//Admin
router.get('/get_deposit',common.whitelistMiddleware, async function(req, res){
	try{
		var depositData = await ethdeposit.find({currency:"ETH"}).sort({createddate:-1});
		if(depositData){
			res.json({status:true,data:depositData});
		}else{
			res.json({status:false,message:"No data found"});
		}
	}
	catch(e){
		res.json({ status : false});
		console.log('get_deposit',e)
	}
});

router.post('/get_deposit', common.whitelistMiddleware,async function(req,res) {
  let pageNo = req.body.pageNo;
  let size = parseInt(req.body.size);
  let query={currency:"ETH"};
  if(pageNo >0 && size > 0) {
    let skips= size * (pageNo - 1);
    let limits = size;
    let search = req.body.search;
    if(search){
      query={'userId': { $regex: '.*' + search + '.*',$options: 'i' }}
    }
    let totalCount= await ethdeposit.find(query).count();
    let depositData= await ethdeposit.find(query).skip(skips).limit(limits).sort({createddate:-1}).lean();
    res.json({status:true,data:depositData,count:totalCount})
  }else{
     res.json({status:false,"message": "Error fetching data"})
  }
})

router.post('/get_maticdeposit', common.whitelistMiddleware,async function(req,res) {
  let pageNo = req.body.pageNo;
  let size = parseInt(req.body.size);
  let query={currency:"MATIC"};
  if(pageNo >0 && size > 0) {
    let skips= size * (pageNo - 1);
    let limits = size;
    let search = req.body.search;
    if(search){
      query={'userId': { $regex: '.*' + search + '.*',$options: 'i' }}
    }
    let totalCount= await ethdeposit.find(query).count();
    let depositData= await ethdeposit.find(query).skip(skips).limit(limits).sort({createddate:-1}).lean();
    res.json({status:true,data:depositData,count:totalCount})
  }else{
     res.json({status:false,"message": "Error fetching data"})
  }
})


module.exports = router;