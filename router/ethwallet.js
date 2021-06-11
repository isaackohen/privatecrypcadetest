const express      = require('express')
var mongoose       = require('mongoose');
const router       = express.Router();
var async          = require('async');
let common         = require('../helpers/common');
const config 	   = require("../config");
const { ethABI }   = require('../constants/eth-abi');
const { dbModel } = require('../model/db');

router.get('/getcontractdetails', common.whitelistMiddleware, async function(req, res) {
	try {
		
		if(ethABI && config.matic && config.eth && config.trx){
			res.json({ status:true, abiarray: ethABI, maticdata:config.matic, ethdata:config.eth, trxdata:config.trx });
		}else{
			res.json({status:false});
		}
		
	}
	catch(e) {
		res.json({ status : false});
		console.log('getabi',e)
	}
});


router.post('/get_linkedaddr',common.tokenMiddleware, async (req, res) => {
	try{
		const userData = await dbModel.wallet.findOne({user_id: req.body.user_id}).lean();
		if (userData && userData.eth_wallet && userData.eth_wallet.address) {
			res.json({status:true, data: userData});
		} else {
			res.json({status:false});
		}
	}
	catch(e){
		res.json({ status : false});
		console.log('get_linkedaddr',e)
	}
});

router.post('/createwallet',common.tokenMiddleware, async (req, res) => {
	try {
		const wallet = await dbModel.wallet.findOne({user_id: req.genuserId}).lean();
		const otherWallet = await dbModel.wallet.findOne({'eth_wallet.address':req.body.linked_addr}).lean();

		if (wallet && wallet.eth_wallet.address)
		{
			res.json({status: false, msg: 'This TRON address is already linked'});
		}
		else if (otherWallet && otherWallet.user_id !== wallet.user_id)
		{
			res.json({status: false, msg: 'This ETH address is already linked to another CrypCade account'});
		}
		else
		{
            await dbModel.wallet.update({user_id: req.genuserId}, {'eth_wallet.address': req.body.linked_addr, 'matic_wallet.address': req.body.linked_addr});
		    res.json({status: true, msg: 'The address is now linked to your TRON address'});
		}
	
	} catch(error) {
		res.json({status: false});
		console.log('createwallet', error);
	}
});

module.exports = router;
