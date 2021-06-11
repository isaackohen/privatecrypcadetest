const express      = require('express')
const mongoose       = require('mongoose');
const router       = express.Router();
const referalContent    = require('../model/db/gaugeContent');
const async          = require('async');
const slots  =require("../model/db/external");
const wallet = require('../model/db/wallet');
var share = require("../model/db/share");
var platishare = require("../model/db/platishare");
const common = require('../helpers/common');
var diviSettings    = require('../model/db/rewardSettings');
var slotSettings    = require('../model/db/externalSettings');
var diceSettings = require("../model/db/dudoSettings");
var referalshare    = require('../model/db/gaugeshare');
var user_detail    = require('../model/db/customer');
var siteSettings = require("../model/db/framework");

// router.post('/bgapiresponse', async function(req,res){
// 	try{
//       	let data=req.body;
//       	var tkn = data.token;
//       	let response;
//       	var userid = tkn.split('CYRADE')[0];
//       	if(mongoose.Types.ObjectId.isValid(userid)){
//       	var walletbalance = await wallet.findOne({_id:userid}).lean(); 
//       	}else{
//       		var walletbalance ='';
//       	}
//       	if(walletbalance){
//       		let tronaddr = walletbalance.user_id;
//       		let n =walletbalance.wallet[0].amount/1000000;
// 			var balance = n.toFixed(2);
// 			var date = new Date();
//  	  		var timestamp = date. getTime();
// 			if(data.name=='login'){
//       	  	 	response={
//              		"uid":data.uid,
//               		"player":{
//                   		"id": userid,
//                   		"brand":"crypcade",
//                   		"currency":"TRX",
//                   		"mode":"REAL",
//                   		"is_test":false
//               		},
// 	              	"balance":{
// 	                  	"value":balance.toString(),
// 	                  	"version":timestamp
// 	              	},
// 	              	"tag":""
// 	          	}
// 	          	return res.send(response);
//       	  	}
//       	  	if(data.name=="transaction"){
// 	      		let slt_data = await slots.findOne({"remotetranid":data.uid}).lean();
// 	      		if(!slt_data){
// 	      			let betdata = data.args.bet ? parseFloat(data.args.bet) : 0;
// 	      			if(parseFloat(betdata)<=parseFloat(balance) || data.args.bonus){
// 	      				let slot_upd = await slotdataupdate(res,balance,data,userid,tronaddr);
// 	      			}else{
// 	      				response={
// 				          "uid":data.uid,
// 				          "balance":{
// 				              "value":balance.toString(),
// 				              "version":timestamp
// 				          },
// 				          "error": {
// 			        			"code": "FUNDS_EXCEED"       
// 			    			}
// 				    	}
// 				    	return res.send(response);	
// 	      			}
// 	      		}else{
// 	      			response={
// 				          "uid":data.uid,
// 				          "balance":{
// 				              "value":balance.toString(),
// 				              "version":timestamp
// 				          }
// 		    		}
// 		    		return res.send(response);	
// 	      		}
//       		}
//       	  	if(data.name=='getbalance'){
// 		        response={
// 		            "uid":data.uid,
// 		            "balance":{
// 		                "value": balance,
// 		                "version":timestamp
// 		            }
// 		        }
//           		return res.send(response);
//       		}
//       		if(data.name=="logout"){
// 	          	response={
// 	              	"uid":data.uid
// 	          	}
//           		return res.send(response)
//      	 	}
//      	 	if(data.name=='rollback'){
//   				response={
// 		          	"uid":data.uid,
// 		          	"balance":{
// 		              	"value":balance.toString(),
// 		              	"version":timestamp
// 		          	}
// 		    	}
//       			return res.send(response);
//       		}
//       	}else{
//   			response={
//   	  			"uid":data.uid,
//   	  			"error":{
//   	  				"code":"INVALID_TOKEN"
//   	  			}
//   	  		}
//   	  		return res.send(response);
//   	  	}
//     }
//   	catch(e){
//     	res.send(e);
//     	console.log('booongo',e);
//   	}
// });


// async function slotdataupdate(res,balance,data,userid,tronaddr){
// 	if(data.args.bet && !data.args.bonus){
// 		var bet_amount = data.args.bet;
//    		var win_amount = data.args.win ? data.args.win : 0;
//     }else{
//     	var bet_amount = 0;
//     	var win_amount = data.args.win ? data.args.win : 0;
//     }
//     var update_amount = parseFloat(bet_amount) - parseFloat(win_amount);
//     var abs_amount = Math.abs(update_amount);
//     if(parseFloat(update_amount)>=0){
//     	var update_nw = parseFloat(abs_amount)*1000000;
//     	if(data.args.transaction_uid){
//     		set = {$inc:{"wallet.$.amount": update_nw}};
//     	}else{
//     		if(parseFloat(balance)>=parseFloat(abs_amount)){
//     		set = {$inc:{"wallet.$.amount": - update_nw}};
// 	    	}else{
// 	    		set = {$inc:{"wallet.$.amount": 0}};
// 	    	}
//     	}
//     }else{
//     	var update_nw = parseFloat(abs_amount)*1000000;
//     	set = {$inc:{"wallet.$.amount": update_nw}};
//     }
//     var findWallet = await wallet.findOneAndUpdate({_id:userid,"wallet.currency":"TRX"},set,{new:true});
//     var usbal = findWallet.wallet[0].amount/1000000;
//     var nw_balance = n.toFixed(2);
//     io.emit('getBal',{'balance':usbal,'address':findWallet.user_id});

//     var common_data =  {"providerid":2,"gameid":data.game_id,"gameName":data.game_name,"md5":data.session,"remotetranid":data.uid,"roundid":data.args.round_id,"userid":userid,"roomid":data.token,"freespin_id":data.args.transaction_uid};
   
//     let betdata={"finished":0,"trntype":"BET","amount":-bet_amount};
//     let bet_data=Object.assign(betdata, common_data);
//     console.log(bet_data,"betttttttttttttttttttttttttttttttttttttttttt")
//     let slotDB_bet = await slots.create(bet_data);

//     var windata =  {"amount":win_amount,"trntype":"WIN","finished":1};
//     let win_data=Object.assign(windata, common_data);
//     console.log(win_data,"winnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnn")
//     let slotDB_win = await slots.create(win_data);

//     if(win_data.amount!="0" && win_data.trntype== 'WIN'){
// 		let alldata= await common.allWinnerdata()
// 		io.emit("allGameData",alldata);
// 	}
//     if(data.args.bet && !data.args.transaction_uid){
//     	let tkn_data = {
// 	      userId:tronaddr,
// 	      betAmount:bet_amount,
// 	      game_type:2 
// 		}
// 		await common.placeToken(tkn_data);
//     }
//     response={
// 	    "uid":data.uid,
// 	    "balance":{
// 	        "value":nw_balance.toString(),
// 	        "version":timestamp
// 	    }
// 	}
// 	res.send(response);
//     let ref_upd = await referal_share(data,userid);
// 	if(data.args.round_finished){
// 		let divi_upd = await update_share(data,userid,tronaddr);
// 	}	      		
// }


router.post('/bgapiresponse', async function(req,res){
	try{
      let data=req.body;
      var tkn = data.token;
      let response;
      var userid = tkn.split('CYRADE')[0];
      if(mongoose.Types.ObjectId.isValid(userid)){
      	var walletbalance = await wallet.findOne({_id:userid}).lean(); 
      }else{
      	var walletbalance = "";
      }
      let slt_data = await slots.findOne({"remotetranid":data.uid}).lean();
      let tronaddr = walletbalance.user_id;
      var date = new Date();
 	  var timestamp = date. getTime();
      if(walletbalance){
      	let n =walletbalance.wallet[0].amount/1000000;
		var balance = n.toFixed(2);
      }
      if(data.name=='login'){
      	  if(walletbalance){
	      	  	 response={
	              "uid":data.uid,
	              "player":{
	                  "id": userid,
	                  "brand":"crypcade",
	                  "currency":"TRX",
	                  "mode":"REAL",
	                  "is_test":false
	              },
	              "balance":{
	                  "value":balance.toString(),
	                  "version":timestamp
	              },
	              "tag":""
	          }
      	  }else{

      	  	response={
      	  		"uid":data.uid,
      	  		"error":{
      	  			"code":"INVALID_TOKEN"
      	  		}
      	  	}
      	  }
  
           res.send(response);
      }
      if(data.name=="transaction"){
      		let betdata = data.args.bet ? parseFloat(data.args.bet) : 0;
      		if(!slt_data){
      			if(parseFloat(betdata)<=parseFloat(balance) || data.args.bonus){
      				let slot_upd = await slotdataupdate(data,userid,tronaddr);
	      			let ref_upd = await referal_share(data,userid);

	      			if(data.args.round_finished){
	      				let divi_upd = await update_share(data,userid,tronaddr);
	      			}
      				
	      			let walletbalance = await wallet.findOne({_id:userid});
				    if(walletbalance){
				      	let n =walletbalance.wallet[0].amount/1000000;
						var nw_balance = n.toFixed(2);
				    }
	      			response={
				          "uid":data.uid,
				          "balance":{
				              "value":nw_balance.toString(),
				              "version":timestamp
				          }
		    		}

      			}else{
      				response={
			          "uid":data.uid,
			          "balance":{
			              "value":balance.toString(),
			              "version":timestamp
			          },
			          "error": {
		        			"code": "FUNDS_EXCEED"       
		    			}
			    	}
      			}

      		}else{
      			response={
			          "uid":data.uid,
			          "balance":{
			              "value":balance.toString(),
			              "version":timestamp
			          }
	    		}
      		}

      		res.send(response);	
      }
      if(data.name=="logout"){
          response={
              "uid":data.uid
          }
          res.send(response)
      }
      if(data.name=='getbalance'){
      	  let walletbalance = await wallet.findOne({_id:userid});
	      if(walletbalance){
	      	let n =walletbalance.wallet[0].amount/1000000;
			var nw_balance = n.toFixed(2);
          }	
          response={
              "uid":data.uid,
              "balance":{
                  "value": nw_balance,
                  "version":timestamp
              }
          }
          res.send(response);
      }
      if(data.name=='rollback'){
      	    let walletbalance = await wallet.findOne({_id:userid});
		    let n =walletbalance.wallet[0].amount/1000000;
			var nw_balance = n.toFixed(2);
  			response={
		          "uid":data.uid,
		          "balance":{
		              "value":nw_balance.toString(),
		              "version":timestamp
		          }
		    		}
      		res.send(response);
      }


  }
  catch(e){
    res.send(e);
    console.log('booongo',e);
  }


});



async function slotdataupdate(data,userid,tronaddr){
	if(data.args.bet && !data.args.bonus){
		var bet_amount = data.args.bet;
   		var win_amount = data.args.win ? data.args.win : 0;
    }else{
    	var bet_amount = 0;
    	var win_amount = data.args.win ? data.args.win : 0;
    }
    var update_amount = parseFloat(bet_amount) - parseFloat(win_amount);
    var abs_amount = Math.abs(update_amount);
    let walletbalance = await wallet.findOne({_id:userid});
    if(walletbalance){
	  	let n =walletbalance.wallet[0].amount/1000000;
		var balance = n.toFixed(2);
	  }

    if(parseFloat(update_amount)>=0){
    	var update_nw = parseFloat(abs_amount)*1000000;
    	if(data.args.transaction_uid){
    		set = {$inc:{"wallet.$.amount": update_nw}};
    	}else{
    		if(parseFloat(balance)>=parseFloat(abs_amount)){
    		set = {$inc:{"wallet.$.amount": - update_nw}};
	    	}else{
	    		set = {$inc:{"wallet.$.amount": 0}};
	    	}
    	}	
    }else{
    	var update_nw = parseFloat(abs_amount)*1000000;
    	set = {$inc:{"wallet.$.amount": update_nw}};
    }
    
    var findWallet = await wallet.findOneAndUpdate({_id:userid,"wallet.currency":"TRX"},set,{new:true});
    var usbal = findWallet.wallet[0].amount/1000000;
    io.emit('getBal',{'balance':usbal,'address':findWallet.user_id});
    var bet_data =  {"providerid":2,"gameid":data.game_id,"gameName":data.game_name,"md5":data.session,"amount":-bet_amount,"remotetranid":data.uid,"trntype":"BET","roundid":data.args.round_id,"userid":userid,"finished":0,"roomid":data.token,"freespin_id":data.args.transaction_uid};
    let slotDB_bet = await slots.create(bet_data);
    var win_data =  {"providerid":2,"gameid":data.game_id,"gameName":data.game_name,"md5":data.session,"amount":win_amount,"remotetranid":data.uid,"trntype":"WIN","roundid":data.args.round_id,"userid":userid,"finished":1,"roomid":data.token,"freespin_id":data.args.transaction_uid};
    let slotDB_win = await slots.create(win_data);
    if(win_data.amount!="0" && win_data.trntype== 'WIN'){
		let alldata= await common.allWinnerdata()
		io.emit("allGameData",alldata);
	}
    if(data.args.bet && !data.args.transaction_uid){
    	let tkn_data = {
	      userId:tronaddr,
	      betAmount:bet_amount,
	      game_type:2 
		}
		await common.placeToken(tkn_data);
    }
    
	
}


async function referal_share(data1,userid){
	var slot_bet = await slots.findOne({roundid:data1.args.round_id,trntype:'BET'}).lean();
	var slot_win = await slots.find({roundid:data1.args.round_id,trntype:'WIN'});
	var slot_win_amount = 0;
	for(i=0;i<slot_win.length;i++){
		var slot_win_amount = parseFloat(slot_win_amount) + parseFloat(slot_win[i].amount); 
	}
	var slot_bet_amount = Math.abs(slot_bet.amount);
	var profit_upd = parseFloat(slot_win_amount)-parseFloat(slot_bet_amount);
	if(parseFloat(profit_upd)>0){
		var wallet_data = await wallet.findOne({_id:userid}).lean();
		var sitesett = await siteSettings.findOne().lean();
		var user_ref = await user_detail.findOne({user_id:wallet_data.user_id}).lean();
	    if(user_ref && user_ref.invitedBy!=""){
	      var usr_det = await user_detail.findOne({_id:user_ref.invitedBy}).lean();
	      var ref_percent = parseFloat(sitesett.referal_percent/100)*profit_upd;
	      var recve_amt = Number(ref_percent).toFixed(5);
	      if(ref_percent>0){
	        var refData = {
	            userId: wallet_data.user_id,
	            ruserId: usr_det.user_id,
	            game:"Slots",
	            bet_amount: slot_bet_amount,
	            win_amount:slot_win_amount,
	            commission_per:sitesett.referal_percent,
	            received_amount:recve_amt
	        }
	        var ins_Data = await referalshare.create(refData);
	      }
	    }

	}
	
}

async function update_share(data1,userid,walletAddress){
	var divisett = await diviSettings.findOne();
	var slotsett = await slotSettings.findOne();
	var slot_bet = await slots.findOne({roundid:data1.args.round_id,trntype:'BET'}).lean();
	var slot_win = await slots.find({roundid:data1.args.round_id,trntype:'WIN'});
	var slot_win_amount = 0;
	for(i=0;i<slot_win.length;i++){
		var slot_win_amount = parseFloat(slot_win_amount) + parseFloat(slot_win[i].amount); 
	}
	if(slot_bet){
		var slot_bet_amount = Math.abs(slot_bet.amount);
	}else{
		var slot_bet_amount = 0;
	}
	
	var real_org = parseFloat(divisett.pool_amount);
	var fake_org = parseFloat(divisett.fake_pool_amount);
	var amount_income = parseFloat(slot_bet_amount)-parseFloat(slot_win_amount);
	var win = (slot_win_amount>0) ? 1 : 0;
	if(amount_income>0){
		var share_amt = parseFloat(slotsett.platipus_share/100)*amount_income;
		var share_per = slotsett.platipus_share;
		var amount_upd = parseFloat(amount_income) - parseFloat(share_amt);
		var in_amt = amount_upd;
		var out_amt = 0;
		var updated_pool =  parseFloat(divisett.pool_amount)+parseFloat(amount_upd);
		var updated_fake_pool =  parseFloat(divisett.fake_pool_amount)+parseFloat(amount_upd);
		let updatedivi = await diviSettings.updateOne({_id:divisett._id},{$set:{pool_amount:updated_pool,fake_pool_amount:updated_fake_pool}});
		let updatedSettings = await diviSettings.findOne({_id:divisett._id}).lean();
		let getProfit = await common.update_profit(walletAddress);
		io.emit('getdivi',{'diviSettings':updatedSettings,'profit':getProfit,'address':walletAddress});
	}else{
		var amount_upd = Math.abs(amount_income);
		var in_amt = 0;
		var out_amt = amount_upd;
		var share_amt = 0;
		var share_per = 0;
		var updated_pool =  parseFloat(divisett.pool_amount)-parseFloat(amount_upd);
		var updated_fake_pool =  parseFloat(divisett.fake_pool_amount)-parseFloat(amount_upd);
		let updatedivi = await diviSettings.updateOne({_id:divisett._id},{$set:{pool_amount:updated_pool,fake_pool_amount:updated_fake_pool}});
		let updatedSettings = await diviSettings.findOne({_id:divisett._id}).lean();
		let getProfit = await common.update_profit(walletAddress);
		io.emit('getdivi',{'diviSettings':updatedSettings,'profit':getProfit,'address':walletAddress});
	}

	var real_mod = parseFloat(updated_pool);
	var fake_mod = parseFloat(updated_fake_pool);
	var wallet_data = await wallet.findOne({_id:userid}).lean();

	var real_mod = parseFloat(updated_pool);
	var fake_mod = parseFloat(updated_fake_pool);
	var wallet_data = await wallet.findOne({_id:userid}).lean();

	if(amount_income>0){

		var platishare_create = {
			userid:wallet_data.user_id,
		    game:data1.game_name,
		    betamount:amount_income,
		    shared_percentage:share_per,
		    shared_amount:share_amt
		}

		var platiData = await platishare.create(platishare_create);
		
	}

	var poolData_create = {
	    userid:wallet_data.user_id,
	    game:'Slots',
	    betamount:slot_bet_amount,
	    win:win,
	    in_amt:in_amt,
	    out_amt:out_amt,
	    real_org:real_org,
	    fake_org:fake_org,
	    real_mod:real_mod,
	    fake_mod:fake_mod,
	    shared_percentage:share_per,
	    shared_amount:share_amt

		}  

 var poolData = await share.create(poolData_create);

	
}

module.exports = router;