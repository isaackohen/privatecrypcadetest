const express      = require('express')
var mongoose       = require('mongoose');
const router       = express.Router();
var roadMap 	   = require('../model/db/roadMap');
var async          = require('async');
var cloudinary 	   = require('cloudinary');
var multer         = require('multer');
var config         = require('../config')
let common         = require('../helpers/common');



router.get('/get_roadMap', common.whitelistMiddleware, async function(req, res){
	try{
		var roadMapData = await roadMap.find();
		res.json({status:true,data:roadMapData});
	}
	catch(e){

		res.json({ status : false});
		console.log('get_roadMap',e)
	}
});


router.post('/add_roadMap', common.whitelistMiddleware, async function(req,res){
	var data = req.body;
	try{
		if(data._id){
			var updateroadMap = await roadMap.update({_id:data._id},{$set:data});
			res.json({status:true,msg:'Updated Successfully!'});
		}else{
			var roadMapData = await roadMap.create(data);
			if(roadMap){
				res.json({status:true,msg:'Created Successfully!'})
			}else{
				res.json({status:false,msg:'Unable to Create'});
			}
		}
	}
	catch(e){
		res.json({ status : false});
		console.log('add_roadMap',e)
	}
})

//Project
router.get('/roapMapList', common.whitelistMiddleware, async function(req, res){
	try{
		var roadMapData = await roadMap.find({status:1});
		res.json({status:true,data:roadMapData});
	}
	catch(e){
		res.json({ status : false});
		console.log('roapMapList',e)
	}
})

module.exports = router;