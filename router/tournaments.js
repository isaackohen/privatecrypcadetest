const express      = require('express')
var mongoose       = require('mongoose');
const router       = express.Router();
var tournaments    = require('../model/db/tournaments');
var providers      = require('../model/db/providers');
var async          = require('async');
let common         = require('../helpers/common');

//Admin
router.get('/get_tournament',common.whitelistMiddleware, async function(req, res){
	try{
		var tournamentData = await tournaments.find();
		res.json({status:true,data:tournamentData});
	}
	catch(e){
		res.json({ status : false});
		console.log('get_tournament',e)
	}
});

router.get('/providerList',common.whitelistMiddleware, async function(req, res){
	try{
		var providerData = await providers.find({status:1});
		res.json({status:true,data:providerData});
	}
	catch(e){
		res.json({ status : false});
		console.log('get_providers',e)
	}
});

//Admin
router.post('/add_tournament', common.whitelistMiddleware,async function(req,res){
	var data = req.body;
	try{
		if(data._id){
			var updateTournament = await tournaments.update({_id:data._id},{$set:data});
			res.json({status:true,msg:'Updated Successfully!'});
		}else{
			var tournamentData = await tournaments.create(data);
			if(tournamentData){
				res.json({status:true,msg:'Created Successfully!'})
			}else{
				res.json({status:false,msg:'Unable to Create'});
			}
		}
	}
	catch(e){
		res.json({ status : false});
		console.log('add_tournament',e)
	}
});

//Project
router.get('/tournamentList', common.whitelistMiddleware,async function(req, res){
	try{
		var tournamentData = await tournaments.find({status:1});
		res.json({status:true,data:tournamentData});
	}
	catch(e){
		res.json({ status : false});
		console.log('tournamentList',e)
	}
});


module.exports = router;