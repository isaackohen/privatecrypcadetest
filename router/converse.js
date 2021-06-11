const express      = require('express')
const mongoose     = require('mongoose');
const router       = express.Router();
const async        = require('async');
var common         = require('../helpers/common');
const chat    	   = require('../model/db/Converse');

//chat-Dice game

router.get("/get_message",common.tokenMiddleware,async function(req,res) {
	try{
		let messageCount = await chat.count();
		let aggregateQuery = [{
            $lookup:{
                from: "Users",    
                localField: "sender_address",
                foreignField: "user_id", 
                as: "user_info"       
              }
            },
            {   $unwind:"$user_info" },
            {$project:{
            	_id:"$_id",
            	game:"$game",
            	message:"$message",
            	sender_address:"$sender_address",
            	createddate:"$createddate",
            	user_info:"$user_info",
            	favourite:"$favourite",
                favcount:{$size:"$favourite"}
            }},
            { $sort : { _id: 1 }, 
        }]
        
        if(messageCount>10){
            aggregateQuery.push({ $skip : messageCount - 10 })
            var result = await chat.aggregate(aggregateQuery);
        }else{
        	var result = await chat.aggregate(aggregateQuery);  
        }
        res.json({ status:true, data:result});
	}catch(e){
		res.json({ status : false});
		console.log('get_message',e)
	}
	// body...
})





// router.get('/get_message',async function(req,res){
// 	try{
// 		let messageCount = await chat.count();
// 		let aggregateQuery = [{
// 	      $lookup:{
// 	        from: "Users",     
// 	        localField: "sender_address", 
// 	        foreignField: "user_id",
// 	        as: "user_info"     
// 	      }
// 	    },
// 	    {   $unwind:"$user_info" },
// 	    { $sort : { _id: 1 } },
// 		]
// 		if(messageCount>10){
// 			aggregateQuery.push({ $skip : messageCount - 10 })
// 			var chatMessage = await chat.aggregate(aggregateQuery);
// 			// var chatMessage = await chat.find({},{_id:1,sender_address:1, message:1, createddate:1, favourite:1}).sort({_id:1}).skip(messageCount-10).limit(30).lean();
// 		}else{
// 			var chatMessage = await chat.aggregate(aggregateQuery);
// 			// var chatMessage = await chat.find({},{_id:1,sender_address:1, message:1, createddate:1, favourite:1}).sort({_id:1}).lean();
// 		}
// 		if(chatMessage){
// 			chatMessage.map(items=>{
// 				let favLength = items.favourite;
// 				items.favcount = favLength.length;
// 				items.sender_address = addressSubstring(items.sender_address);
// 			});
// 		}else{
// 			res.json({ status:false, data:"Error"})
// 		}
// 	} catch(e){
// 		res.json({ status : false});
// 		console.log('get_message',e)
// 	}
// })



router.post('/add_fav', common.tokenMiddleware,async function(req,res){
	try{
		var data = req.body,value,count;
		var favouriteData = await chat.findOne({_id:data._id});
		if(favouriteData){
			let docs = favouriteData.favourite;
			let test = docs.includes(req.genuserId)
			if(test){
				let documents = await chat.update({_id:favouriteData._id},{$pull:{favourite:req.genuserId}})
				if(documents){
					let document1=await chat.findOne({_id:data._id})
					if(document1){
						value = document1.favourite
						count = value.length
						if(document1){
							res.json({
								status:true,message:"Remove Favorite",count:count
							})
						}else{
							res.json({
								status:false,message:"Error"
							})
						}
					}
				}
			}
			else{
				let documents= await chat.update({_id:favouriteData._id},{$push:{favourite:req.genuserId}})
				if(documents){
					let document1=await chat.findOne({_id:data._id});
					if(document1){
						value = document1.favourite
						count = value.length
						res.json({
							status:true,message:"Add Favorite",data:"Active",count:count
						})
					} else{
							res.json({
								status:false,message:"Error"
							})
						}
				}else{
					res.json({
						status:false,message:"Error"
					})
				}
			}
		}else{
			res.json({
				status:false,message:"Address is undefined"
			})
		}
	} catch(e){
		res.json({ status : false});
		console.log('add_fav',e)
	}
});



router.get('/getMessage',common.whitelistMiddleware,async function(req,res){
	try{
		let chatMessage = await chat.find().sort({_id:-1});
		if(chatMessage){
			res.json({status:true,data:chatMessage})
		} else{
			res.json({status:false,})
		}
	} catch(e){
		res.json({ status : false});
		console.log('getMessage',e)
	}
});

router.post('/deleteMessage',common.whitelistMiddleware,async function(req,res){
	try{
		let chatMessage = await chat.deleteOne({_id:req.body._id});
		if(chatMessage){
			res.json({status:true,msg:"Removed Successfully!"})
		} else{
			res.json({status:false,})
		}
	} catch(e){
		res.json({ status : false});
		console.log('getMessage',e)
	}
});

module.exports = router;