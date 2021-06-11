const express      = require('express')
var mongoose       = require('mongoose');
const router       = express.Router();
var deposit        = require('../model/db/deposit');
var async          = require('async');
var common         = require('../helpers/common');

//Admin
router.get('/get_total',common.whitelistMiddleware, async function(req, res){
	try{
		var totalData = await deposit.aggregate([ { $match: {status:1,currency:"TRX"} },{$group:{_id:null,amount:{$sum:"$amount"}}}]);
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
		var depositData = await deposit.find({currency:"TRX"}).sort({createddate:-1});
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
  let query={currency:"TRX"};
  if(pageNo >0 && size > 0) {
    let skips= size * (pageNo - 1);
    let limits = size;
    let search = req.body.search;
    if(search){
      query={'userId': { $regex: '.*' + search + '.*',$options: 'i' }}
    }
    let totalCount= await deposit.find(query).count();
    let depositData= await deposit.find(query).skip(skips).limit(limits).sort({createddate:-1}).lean();
    res.json({status:true,data:depositData,count:totalCount})
  }else{
     res.json({status:false,"message": "Error fetching data"})
  }
})

//Admin
router.post('/add_deposit',common.whitelistMiddleware, async function(req,res){
	var data = req.body;
	try{
		if(data._id){
			var updateDeposit = await deposit.update({_id:data._id},{$set:data});
			res.json({status:true,msg:'Updated Successfully!'});
		}else{
			var depositExists = await deposit.findOne({txnid:data.txnid}).lean();
			if(!depositExists){
				var depositData = await deposit.create(data);
				if(depositData){
					res.json({status:true,msg:'Created Successfully!'})
				}else{
					res.json({status:false,msg:'Unable to Create'});
				}
			}else{
				res.json({status:false})
			}
		}
	}
	catch(e){
		res.json({ status : false});
		console.log('add_deposit',e)
	}
})


module.exports = router;