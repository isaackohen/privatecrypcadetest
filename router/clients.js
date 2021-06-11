const express      = require('express')
var mongoose       = require('mongoose');
const router       = express.Router();
var clients    = require('../model/db/clients');
var async          = require('async');
let common         = require('../helpers/common');

//Admin
router.get('/get_clients',common.whitelistMiddleware, async function(req, res){
	try{
		var clientsData = await clients.find();
		res.json({status:true,data:clientsData});
	}
	catch(e){
		res.json({ status : false});
		console.log('get_clients',e)
	}
});

//Admin
router.post('/add_clients',common.whitelistMiddleware, async function(req,res){
	var data = req.body;
	try{
		if(data._id){
			var updateClients = await clients.update({_id:data._id},{$set:data});
			res.json({status:true,msg:'Updated Successfully!'});
		}else{
			var clientsData = await clients.create(data);
			if(clientsData){
				res.json({status:true,msg:'Created Successfully!'})
			}else{
				res.json({status:false,msg:'Unable to Create'});
			}
		}
	}
	catch(e){
		res.json({ status : false});
		console.log('add_clients',e)
	}
});

//Project
router.get('/clientList',common.whitelistMiddleware, async function(req, res){
	try{
		var clientsData = await clients.find({status:1});
		res.json({status:true,data:clientsData});
	}
	catch(e){
		res.json({ status : false});
		console.log('clientList',e)
	}
})


module.exports = router;