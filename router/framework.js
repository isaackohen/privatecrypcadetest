const express      = require('express')
var mongoose       = require('mongoose');
const router       = express.Router();
var db = require('../model/db/framework');
var async          = require('async');
var multer       = require('multer');
var multerS3     = require('multer-s3');
const AWS        = require('aws-sdk');
var config = require('../config')
let common = require('../helpers/common');
let emailTemplate = require('../model/db/Emailtemplate');
let mail = require('../helpers/mailHelper');

AWS.config.update({accessKeyId: config.AWS_OPTIONS.accessKeyId,secretAccessKey:config.AWS_OPTIONS.secretAccessKey,region:config.AWS_OPTIONS.region});
const s3 = new AWS.S3();


var upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: 'crypcade/images',
    key: function (req, file, cb) {
      cb(null, file.originalname.split('.')[0]+new Date().getTime()+'.'+ file.originalname.split('.')[1]);
    }
  })
});

let apiresponse = {
  status: 200,
  message: "",
  data: [],
  cmscount: 0
};


//Admin
router.get('/getsettings', common.whitelistMiddleware, (req, res) => {
	try {
			common.redisConfig('sitesetting', '', (resData) => {
					var getarray={
						 copyrights: resData[0].copyrights ,
						 facebook: resData[0].facebook ,
						 instagram: resData[0].instagram ,
						 youtube: resData[0].youtube ,
						 profit_limit: resData[0].profit_limit,
						 updated_profit_limit: resData[0].updated_profit_limit,
						 media: resData[0].media ,
						 site_maintenance: resData[0].site_maintenance ,
						 sitetitle: resData[0].sitetitle ,
						 sitename: resData[0].sitename,
						 twitter: resData[0].twitter ,
						 sitelogo: resData[0].sitelogo ,
						 favicon: resData[0].favicon ,
						 contactmail: resData[0].contactmail ,
						 supportmail: resData[0].supportmail ,
						 contactphone: resData[0].contactphone ,
						 footercontent: resData[0].footercontent,
						 subscriptioncontent: resData[0].subscriptioncontent,
						 telegram: resData[0].telegram,
						 telegram_news: resData[0].telegram_news,
						 referal_percent:resData[0].referal_percent,
						 referal_cade:resData[0].referal_cade ,
						 page_enable:resData[0].page_enable
					};
				res.json({'status':true,'data':getarray})
		 })
			
	}
	catch (e) {
			res.json({
					status: false,
					"Message": "Something went wrong",
			})
	}
})

//Admin
router.post('/edit_sitesetting',common.whitelistMiddleware, (req, res) => {
	// todo is this used?
	try{
		db.findOne({_id:req.body._id},function(err,response){
			if(response){
				if(req.body.type == 'updated'){
					req.body.updated_profit_limit = req.body.profit_limit;
				}
				db.updateOne({},{ $set:req.body}).exec(function(err, resUpdate){
					io.emit('get_siteset',resUpdate)
					res.json({ "status": true});
						// common.SetredisConfig('sitesetting', '', (resData) => {
						// 	if(err){
						// 		res.json({ "status": false});
						// 	}
						// 	else{
						// 		io.emit('get_siteset',resUpdate)
						// 		res.json({ "status": true});
						// 	}
						// });						
				});
			}
			else{
				var myData = new db(req.body);
	      myData.save();
	      res.json({success:true})
			}
		})
	}
	catch(e){
		res.json({ "status": false});
		console.log('edit_sitesetting',e)
	}
});

router.post('/sent_mail',common.whitelistMiddleware, async function (req,res){
	try{
		let etempdata = await emailTemplate.findOne({ title: "limit_warning" });
		let siteSetting = await db.findOne().lean();
		let link = config.apiUrl+'update_profitLimit';
			
	}
	catch(e){
		res.json({ "status": false});
		console.log('sent_mail',e)
	}
	
})






router.post("/uploadPhoto",common.whitelistMiddleware, upload.array("uploads[]", 12), async function (req, res) {
  try{
    if(req.files.length > 0){
      var params = {
        Bucket: 'crypcade/images',
        ACL: 'public-read',
        Key: req.files[0].originalname.split('.')[0]+new Date().getTime()+'.'+req.files[0].originalname.split('.')[1],
        Body: req.files[0].path,
        ContentEncoding:'base64'
      };
      s3.putObject(params).promise().then(pres=>{
        var result = {secure_url:req.files[0].location};
        res.json({"status": true,"result":result});
      }).catch(err=>{
        res.json({"status": false});  
      })
    }
    else{
      res.json({"status": false});
    }
  }
  catch(e){
    res.json({"status": false});
    console.log("upload",e);
  }
});


//Admin
router.post('/updateimage1',common.whitelistMiddleware, (req, res) => {
	// todo is this used?
	try{
		db.updateOne({},{ $set:{"sitelogo":req.body.image}}).exec(function(err, resUpdate){
				common.SetredisConfig('sitesetting', '', (resData) => {
					if(err){
						res.json({ "status": false});
					}
					else{
						res.json({ "status": true});
					}
				});	
		});
	}
	catch(e){
		res.json({ "status": false});
		console.log('updateimage1',e)
	}
});

//Admin
router.post('/updateimage2',common.whitelistMiddleware, (req, res) => {
	// todo is this used?
	try{
		db.updateOne({},{ $set:{"favicon":req.body.image}}).exec(function(err, resUpdate){
				common.SetredisConfig('sitesetting', '', (resData) => {
					if(err){
						res.json({ "status": false});
					}
					else{
						res.json({ "status": true});
					}
				});	
		});
	}
	catch(e){
		res.json({ "status": false});
		console.log('updateimage2',e)
	}
});


//Project
router.get('/get_settings', common.whitelistMiddleware, async function(req, res){
	try{
		var siteSetting = await db.findOne({}).lean();
		delete siteSetting.admin_cold_wallet;
		res.json({'status':true,'data':siteSetting});
	}
	catch(e){
		res.json({ "status": false});
		console.log('get_settings',e)
	}
});

module.exports = router;