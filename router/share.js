const express      = require('express')
var mongoose       = require('mongoose');
const router       = express.Router();
var share    	   = require('../model/db/share');
var async          = require('async');
var common         = require('../helpers/common');

//Admin
router.get('/get_total',common.whitelistMiddleware, async function(req, res){
	try{
		var totalData = await share.aggregate([ { $match: {status:1} },{$group:{_id:null,amount:{$sum:"$amount"}}}]);
		res.json({status:true,data:totalData[0].amount});	
	}
	catch(e){
		res.json({ status : false});
		console.log('get_total',e)
	}
});

router.get('/get_sharetrans',common.whitelistMiddleware, async function(req, res){
	try{
		var sharetranData = await share.find().lean();
		if(sharetranData){
			res.json({status:true,data:sharetranData});
		}else{
			res.json({status:false,message:"No data found"});
		}
	}
	catch(e){
		res.json({ status : false});
		console.log('get_admintrans',e)
	}
});

//Admin
router.post('/get_sharetranslist', async function(req, res){
	try{
		 let pageNo = req.body.pageNo;
		  let size = parseInt(req.body.size);
		  let query={};
		  if(pageNo >0 && size > 0) {
		    let skips= size * (pageNo - 1);
		    let search = req.body.search;
		    if(search){
		      query={'userid': { $regex: '.*' + search + '.*',$options: 'i' }}
		    }
		    let totalCount= await share.find(query).count();
		    let dividendShareData= await share.find(query).skip(skips).limit(size).sort({_id:-1}).lean();
		    res.json({status:true,data:dividendShareData,count:totalCount})
		  }else{
		     res.json({status:false,"message": "No data found"})
		  }
	}
	catch(e){
		res.json({ status : false});
		console.log('get_admintrans',e)
	}
});


module.exports = router;