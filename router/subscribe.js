const express    = require('express')
var mongoose     = require('mongoose');
const router     = express.Router();
var subscribe    = require('../model/db/subscribe');
var async        = require('async');
let common         = require('../helpers/common');
let emailTemplate = require('../model/db/Emailtemplate');
let mail = require('../helpers/mailHelper');

router.get('/get_subscribe',common.whitelistMiddleware, async function(req, res){
	try{
		var subscribeData = await subscribe.find();
		res.json({status:true,data:subscribeData});
	}
	catch(e){
		res.json({ status : false});
		console.log('get_subscribe',e);
	}
});

router.get('/get_subscribe_active',common.whitelistMiddleware, async function(req, res){
	try{
		var subscribeData = await subscribe.find({"status":1});
		res.json({status:true,data:subscribeData});
	}
	catch(e){
		res.json({ status : false});
		console.log('get_subscribe_active',e);
	}
});


router.post('/add_subscribe',common.whitelistMiddleware, async function(req,res){
	var data = req.body;
	var email = data.email.toLowerCase();
	var data_ins = {"email":email}
	try{
		if(data._id){
			var updateSubscribe = await subscribe.update({_id:data._id},{$set:data});
			res.json({status:true,msg:'Updated Successfully!'});
		}else{
			var subscribeData = await subscribe.findOne({"email":email});
			if(subscribeData){
				res.json({status:false,msg:'Email Already Exists'})
			}else{
				var subscribeCreate = await subscribe.create(data_ins);
				res.json({status:true,msg:'Created Successfully!'});
			}
		}
	}
	catch(e){
		res.json({ status : false});
		console.log('add_subscribe',e);
	}
});

router.post('/newsletter',common.whitelistMiddleware, async function(req,res){
	var data = req.body;
	var email_data = data.email;
	var subject = data.subject;
	var message = data.message;
	var email_arr = [];
	
	try{

		if(data.email){
		for(i=0;i<email_data.length;i++){
		  	let etempdata = await emailTemplate.findOne({ title: "newsletter" });
		    if(etempdata){
		         var etempdataDynamic = etempdata.mailcontent.replace(/###mail###/g, email_data[i]).replace(/###CONTENT###/g,message);
		         mail.sendMail({ to: email_data[i], subject: subject, html: etempdataDynamic }, function (mailRes) {
		         })  
		    }
		  }
		  res.json({status:true})	
		}else{
			var subscribeData = await subscribe.find({"status":1});
			if(subscribeData){
				for(let i=0; i<subscribeData.length; i++){
	     	  	let etempdata = await emailTemplate.findOne({ title: "newsletter" });
	     	  	if(etempdata){
				         var etempdataDynamic = etempdata.mailcontent.replace(/###mail###/g, subscribeData[i].email).replace(/###CONTENT###/g,message);
				         mail.sendMail({ to: subscribeData[i].email, subject: subject, html: etempdataDynamic }, function (mailRes) {
				         })  
				 }
	        	}
		  		res.json({status:true})
			}else{
				res.json({status:true})
			}
			
	      
		}

	}
	catch(e){
		res.json({ status : false});
		console.log('add_subscribe',e);
	}
});


module.exports = router;