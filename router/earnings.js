const express      = require('express')
var mongoose       = require('mongoose');
const router       = express.Router();
var earnings    = require('../model/db/earnings');
var async          = require('async');
var common         = require('../helpers/common');

//Admin
router.get('/get_total',common.whitelistMiddleware, async function(req, res){
	try{
		var totalData = await earnings.aggregate([ { $match: {status:1} },{$group:{_id:null,amount:{$sum:"$amount"}}}]);
		res.json({status:true,data:totalData[0].amount});	
	}
	catch(e){
		res.json({ status : false});
		console.log('get_total',e)
	}
});

//Admin
router.get('/get_admintrans',common.whitelistMiddleware, async function(req, res){
	try{
		var earningtranData = await earnings.find().sort({createddate:-1});
		if(earningtranData){
			res.json({status:true,data:earningtranData});
		}else{
			res.json({status:false,message:"No data found"});
		}
	}
	catch(e){
		res.json({ status : false});
		console.log('get_admintrans',e)
	}
});

router.post('/get_admintrans',common.whitelistMiddleware,async function(req,res) {
  let pageNo = req.body.pageNo;
  let size = parseInt(req.body.size);

  console.log(pageNo,size)
  if(pageNo >0 && size > 0) {
    let skips= size * (pageNo - 1);
    let limits = size;
    let totalCount= await earnings.find({}).count();
    let earningtranData= await earnings.find({}).skip(skips).limit(limits).sort({createddate:-1}).lean();
    res.json({status:true,data:earningtranData,count:totalCount})
  }else{
     res.json({status:false,"message": "Error fetching data"})
  }
})


router.get('/get_admintrans_export',common.whitelistMiddleware, async function(req, res){
	try{
		var earningtranData = await earnings.find().sort({createddate:-1});
		if(earningtranData){
			res.json({status:true,data:earningtranData});
		}else{
			res.json({status:false,message:"No data found"});
		}
	}
	catch(e){
		res.json({ status : false});
		console.log('get_admintrans',e)
	}
});


module.exports = router;