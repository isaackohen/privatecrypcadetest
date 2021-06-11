const express       = require('express')
var mongoose        = require('mongoose');
const router       	= express.Router();

var withdraw    	= require('../model/db/move');
var withdrawdivi    = require('../model/db/movedividend');
var withdrawref     = require('../model/db/movereferal');
var withdrawexpiry  = require('../model/db/moveexpiry');
var withdrawclaim   = require('../model/db/moveclaim');
var withdrawcontract = require('../model/db/movecontract');
var withdrawplati   = require('../model/db/moveplati');
let common          = require('../helpers/common');

//Admin

router.get('/get_total',common.whitelistMiddleware, async function(req, res){
	try{
		var totalData = await withdraw.aggregate([ { $match: {currency:"TRX",status:1} },{$group:{_id:null,amount:{$sum:"$amount"}}}]);
		res.json({status:true,data:totalData[0].amount});	
	}
	catch(e){
		res.json({ status : false});
		console.log('get_total',e)
	}
});


router.get('/get_withdraw', common.whitelistMiddleware, async function(req, res){
	try{
		var withdrawData = await withdraw.find({currency:"TRX"}).sort({createddate:-1});
		if(withdrawData){
			res.json({status:true,data:withdrawData});
		}else{
			res.json({status:false,message:"No data found"});
		}	
	}
	catch(e){
		res.json({ "status": false});
		console.log('get_withdraw',e);
	}
});

router.get('/get_ethwithdraw', common.whitelistMiddleware, async function(req, res){
	try{
		var withdrawData = await withdraw.find({currency:"ETH"}).sort({createddate:-1});
		if(withdrawData){
			res.json({status:true,data:withdrawData});
		}else{
			res.json({status:false,message:"No data found"});
		}	
	}
	catch(e){
		res.json({ "status": false});
		console.log('get_ethwithdraw',e);
	}
});

router.get('/get_maticwithdraw', common.whitelistMiddleware, async function(req, res){
	try{
		var withdrawData = await withdraw.find({currency:"MATIC"}).sort({createddate:-1});
		if(withdrawData){
			res.json({status:true,data:withdrawData});
		}else{
			res.json({status:false,message:"No data found"});
		}	
	}
	catch(e){
		res.json({ "status": false});
		console.log('get_maticwithdraw',e);
	}
});

router.post('/get_withdraw',common.whitelistMiddleware,async function(req,res) {
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
    let totalCount= await withdraw.find(query).count();
    let withdrawData= await withdraw.find(query).skip(skips).limit(limits).sort({createddate:-1}).lean();
    res.json({status:true,data:withdrawData,count:totalCount})
  }else{
     res.json({status:false,"message": "Error fetching data"})
  }

});

router.post('/get_ethwithdraw',common.whitelistMiddleware,async function(req,res) {
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
    let totalCount= await withdraw.find(query).count();
    let withdrawData= await withdraw.find(query).skip(skips).limit(limits).sort({createddate:-1}).lean();
    res.json({status:true,data:withdrawData,count:totalCount})
  }else{
     res.json({status:false,"message": "Error fetching data"})
  }

});

router.post('/get_maticwithdraw',common.whitelistMiddleware,async function(req,res) {
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
    let totalCount= await withdraw.find(query).count();
    let withdrawData= await withdraw.find(query).skip(skips).limit(limits).sort({createddate:-1}).lean();
    res.json({status:true,data:withdrawData,count:totalCount})
  }else{
     res.json({status:false,"message": "Error fetching data"})
  }

})


router.get('/get_claimwithdraw', common.whitelistMiddleware, async function(req, res){
	try{
		var withdrawData = await withdrawclaim.find().sort({createddate:-1});
		if(withdrawData){
			res.json({status:true,data:withdrawData});
		}else{
			res.json({status:false,message:"No data found"});
		}	
	}
	catch(e){
		res.json({ "status": false});
		console.log('get_claimwithdraw',e);
	}
});

router.post('/get_claimwithdraw',common.whitelistMiddleware,async function(req,res) {
  let pageNo = req.body.pageNo;
  let size = parseInt(req.body.size);
  let query={};
  if(pageNo >0 && size > 0) {
    let skips= size * (pageNo - 1);
    let limits = size;
    let search = req.body.search;
    if(search){
      query={'userId': { $regex: '.*' + search + '.*',$options: 'i' }}
    }
    let totalCount= await withdrawclaim.find(query).count();
    let withdrawData= await withdrawclaim.find(query).skip(skips).limit(limits).sort({createddate:-1}).lean();
    res.json({status:true,data:withdrawData,count:totalCount})
  }else{
     res.json({status:false,"message": "Error fetching data"})
  }

})

router.get('/get_diviwithdraw', common.whitelistMiddleware, async function(req, res){
	try{
		var withdrawData = await withdrawdivi.find().sort({createddate:-1});
		if(withdrawData){
			res.json({status:true,data:withdrawData});
		}else{
			res.json({status:false,message:"No data found"});
		}	
	}
	catch(e){
		res.json({ "status": false});
		console.log('get_diviwithdraw',e)
	}
});

router.get('/get_refwithdraw', common.whitelistMiddleware, async function(req, res){
	try{
		var withdrawData = await withdrawref.find().sort({createddate:-1});
		if(withdrawData){
			res.json({status:true,data:withdrawData});
		}else{
			res.json({status:false,message:"No data found"});
		}	
	}
	catch(e){
		res.json({ "status": false});
		console.log('get_refwithdraw',e)
	}
});

router.post('/get_refwithdraw',common.whitelistMiddleware,async function(req,res) {
  let pageNo = req.body.pageNo;
  let size = parseInt(req.body.size);
  let query={};
  if(pageNo >0 && size > 0) {
    let skips= size * (pageNo - 1);
    let limits = size;
    let search = req.body.search;
    if(search){
      query={'userId': { $regex: '.*' + search + '.*',$options: 'i' }}
    }
    let totalCount= await withdrawref.find(query).count();
    let withdrawData= await withdrawref.find(query).skip(skips).limit(limits).sort({createddate:-1}).lean();
    res.json({status:true,data:withdrawData,count:totalCount})
  }else{
     res.json({status:false,"message": "Error fetching data"})
  }
})


router.get('/get_expirywithdraw', common.whitelistMiddleware, async function(req, res){
	try{
		var withdrawData = await withdrawexpiry.find().sort({createddate:-1});
		if(withdrawData){
			res.json({status:true,data:withdrawData});
		}else{
			res.json({status:false,message:"No data found"});
		}	
	}
	catch(e){
		res.json({ "status": false});
		console.log('get_expirywithdraw',e)
	}
});
//Admin
router.post('/add_withdraw',common.whitelistMiddleware, async function(req,res){
	var data = req.body;
	try{
		var withdrawExists = await withdraw.findOne({txnid:data.txnid}).lean();
		if(!withdrawExists){
			var withdrawData = await withdraw.create(data);
			if(withdrawData){
				res.json({status:true,msg:'Created Successfully!'})
			}else{
				res.json({status:false,msg:'Unable to Create'});
			}
		}
	}
	catch(e){
		res.json({ "status": false});
		console.log('add_withdraw',e)
	}
});


router.post('/add_withdraw_dividend',common.whitelistMiddleware, async function(req,res){
	var data = req.body;
	try{
		var withdrawExists = await withdrawdivi.findOne({txnid:data.txnid}).lean();
		if(!withdrawExists){
			var withdrawData = await withdraw.create(data);
			if(withdrawData){
				res.json({status:true,msg:'Created Successfully!'})
			}else{
				res.json({status:false,msg:'Unable to Create'});
			}
		}
	}
	catch(e){
		res.json({ "status": false});
		console.log('add_withdraw',e)
	}
});

router.post('/add_withdraw_contract',common.whitelistMiddleware, async function(req,res){
	var data = req.body;
	try{
		var withdrawExists = await withdrawcontract.findOne({txnid:data.txnid}).lean();
		if(!withdrawExists){
			var withdrawData = await withdrawcontract.create(data);
			if(withdrawData){
				res.json({status:true,msg:'Created Successfully!'})
			}else{
				res.json({status:false,msg:'Unable to Create'});
			}
		}
	}
	catch(e){
		res.json({ "status": false});
		console.log('add_withdraw',e)
	}
});

router.get('/get_conwithdraw', common.whitelistMiddleware, async function(req, res){
	try{
		var withdrawData = await withdrawcontract.find().sort({createddate:-1});
		if(withdrawData){
			res.json({status:true,data:withdrawData});
		}else{
			res.json({status:false,message:"No data found"});
		}	
	}
	catch(e){
		res.json({ "status": false});
		console.log('get_conwithdraw',e)
	}
});

router.post('/get_conwithdraw',common.whitelistMiddleware,async function(req,res) {
  let pageNo = req.body.pageNo;
  let size = parseInt(req.body.size);
  let query={};
  if(pageNo >0 && size > 0) {
    let skips= size * (pageNo - 1);
    let limits = size;
    let search = req.body.search;
    if(search){
      query={'userId': { $regex: '.*' + search + '.*',$options: 'i' }}
    }
    let totalCount= await withdrawcontract.find(query).count();
    let withdrawData= await withdrawcontract.find(query).skip(skips).limit(limits).sort({createddate:-1}).lean();
    res.json({status:true,data:withdrawData,count:totalCount})
  }else{
     res.json({status:false,"message": "Error fetching data"})
  }
})

router.get('/get_platiwithdraw', common.whitelistMiddleware, async function(req, res){
	try{
		var withdrawData = await withdrawplati.find().sort({createddate:-1});
		if(withdrawData){
			res.json({status:true,data:withdrawData});
		}else{
			res.json({status:false,message:"No data found"});
		}	
	}
	catch(e){
		res.json({ "status": false});
		console.log('get_platiwithdraw',e)
	}
});

router.post('/get_platiwithdraw',common.whitelistMiddleware,async function(req,res) {
  let pageNo = req.body.pageNo;
  let size = parseInt(req.body.size);
  let query={};
  if(pageNo >0 && size > 0) {
    let skips= size * (pageNo - 1);
    let limits = size;
    let search = req.body.search;
    if(search){
      query={'userId': { $regex: '.*' + search + '.*',$options: 'i' }}
    }
    let totalCount= await withdrawplati.find(query).count();
    let withdrawData= await withdrawplati.find(query).skip(skips).limit(limits).sort({createddate:-1}).lean();
    res.json({status:true,data:withdrawData,count:totalCount})
  }else{
     res.json({status:false,"message": "Error fetching data"})
  }

})


module.exports = router;