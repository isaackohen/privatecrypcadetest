const express = require("express");
var mongoose = require("mongoose");
const router = express.Router();
var wallet = require("../model/db/wallet");
var dice = require("../model/db/dudo");
var dicewin = require("../model/db/dicewin");
var dudowin = require("../model/db/dudowin");
var share = require("../model/db/share");
var diceLevel = require("../model/db/dudoLevels");
var diceSettings = require("../model/db/dudoSettings");
var siteSettings = require("../model/db/framework");
var config = require('../config')
let emailTemplate = require('../model/db/Emailtemplate');
let mail = require('../helpers/mailHelper');
var async = require("async");
var diviSettings    = require('../model/db/rewardSettings');
var referalshare    = require('../model/db/gaugeshare');
var user_detail    = require('../model/db/customer');
const common = require("../helpers/common");

router.get("/get_dice", common.whitelistMiddleware, async function(req, res) {
  try {
    var diceData = await dice
      .find()
      .sort({ _id: -1 })
      .limit(20);
    res.json({ status: true, data: diceData });
  } catch (e) {
    res.json({ status: false });
    console.log("get_dice", e);
  }
});

router.get("/get_all_dice", common.whitelistMiddleware, async function(req, res) {
  try {
    var diceData = await dice.find().sort({ _id: -1 });
    res.json({ status: true, data: diceData });
  } catch (e) {
    res.json({ status: false });
    console.log("get_dice", e);
  }
});

router.post("/placebet",common.tokenMiddleware,async function(req,res){
  var data = req.body;
  let set = {};
  var luckyNumber = 99;
  var winStatus;
  var winningChance;
  var luckygen = data.luckygen;
  try{
    var dicesett = await diceSettings.findOne();
    var findWallet = await wallet.findOne({user_id:data.user_id});
    var userbal = findWallet.wallet[0].amount/1000000;
    var userbal = parseFloat(userbal)-parseFloat(dicesett.firstlevel_percent);
    var sitesett = await siteSettings.findOne();
    var divisett = await diviSettings.findOne();
    if(data.rollStatus == 'over'){
      var winningChance = dicesett.max_prediction - data.prediction;
    }else{
      var winningChance = data.prediction;
    }
    var multiplier = (dicesett.multiplier/winningChance).toFixed(4);
    var betAmount = data.amount * 1000000;
    var profit = (data.amount * multiplier).toFixed(4);
    var profitToWin = profit * 1000000;
    if(luckygen>0)
    {
        var generatedLucky = data.luckyNumber;
        if(data.rollStatus == 'over'){ 
            var winStatus = generatedLucky > data.prediction ? true : false;
          }else{
            var winStatus = generatedLucky < data.prediction ? true : false;
          }
        let sta = await savedicedata(data,winStatus,multiplier,profit,profitToWin,userbal,winningChance);
        if(sta)
        {
          res.json({status:true,msg:'success'});

        }
        
     }   
    
    
   if(luckygen==0){
    if(findWallet){
      if(parseFloat(data.amount) <= parseFloat(userbal))
      {

        if(parseFloat(data.amount) <= parseFloat(data.max_amount)){
          if(parseFloat(data.amount) >= parseFloat(dicesett.min_betAmount)){
            if(parseFloat(data.amount) <= parseFloat(userbal)){
              if(data.luckygen==0)
              {
                set = {$inc:{"wallet.$.amount": - betAmount}};
                await wallet.update({user_id:data.user_id, "wallet.currency": "TRX"},set);
                io.emit('getBal',userbal);
                var pool_amount = divisett.fake_pool_amount;
                var xper = dicesett.firstlevel_start;
                var nper = parseFloat(100)-parseFloat(dicesett.firstlevel_end);
                var calculatedAmount = (parseFloat(xper)/100)*parseFloat(pool_amount);
                var dudo_win  = await dudowin.findOne({userId:data.user_id,prediction:winningChance}).lean();

                if(calculatedAmount>data.amount && calculatedAmount>0){
                   //normal case
                  console.log("normal");
                  var luck_data = {min:0, max:99, type:'winloss'};
                  res.json({ status: true, msg:"lucky",data:luck_data });
                  

                  
                }else{

                  console.log("loss by wining chance")

                  if(nper<=0){

                    if(data.rollStatus == 'over'){
                    var luck_data = {min:0, max:data.prediction, type:'loss'};
                    res.json({ status: true, msg:"lucky",data:luck_data });  
                    
                    }else{
                        var luck_data = {min:data.prediction, max:99, type:'loss'};
                        res.json({ status: true, msg:"lucky",data:luck_data });
                       
                    }

                  }


                  var win_cal = (parseFloat(dicesett.firstlevel_end)/100)*winningChance;
                  console.log("hdgfhdg",win_cal)
                  var win_rnd = Math.round(win_cal);
                  console.log("shgdhs",win_rnd);
              


                  var dicewin_rand = await table_random(win_rnd);
                  var dicewin_sta = await dicewin.findOne({userId:data.user_id,prediction:winningChance,winpercent:dicesett.firstlevel_end}).lean();

                  if(dicewin_sta){
                    if(dicewin_sta.betcount==100){
                      let dicewin_remove = await dicewin.remove({userId:data.user_id,prediction:winningChance,winpercent:dicesett.firstlevel_end});
                      let dicewin_create = await dicewin.create({userId:data.user_id,prediction:winningChance,loss_count:dicewin_rand,betcount:1,winpercent:dicesett.firstlevel_end});
                    }

                    var str = dicewin_sta.loss_count;
                    var split_str = str.split(",");
                    var bet_cnt = dicewin_sta.betcount.toString();
                    let dicewin_upd = parseInt(dicewin_sta.betcount)+1;
                    let dicewin_chg = await dicewin.updateOne({userId:data.user_id,prediction:winningChance},{$set:{betcount:dicewin_upd}});

                    if(split_str.indexOf(bet_cnt) !== -1){
                      if(data.rollStatus == 'over'){
                              var luck_data = {min:0, max:data.prediction, type:'loss'};
                          }else{
                               var luck_data = {min:data.prediction, max:99, type:'loss'};
                          }
                       res.json({ status: true, msg:"lucky",data:luck_data });
   
                    }else{
                      var luck_data = {min:0, max:99, type:'winloss'};
                      res.json({ status: true, msg:"lucky",data:luck_data });
                    }

                  }else{
                    let dicewin_create = await dicewin.create({userId:data.user_id,prediction:winningChance, loss_count:dicewin_rand,betcount:1,winpercent:dicesett.firstlevel_end});
                    var luck_data = {min:0, max:99, type:'winloss'};
                    res.json({ status: true, msg:"lucky",data:luck_data });

                  }
                

                
                 
                }
                
                
              }
           

            }
            else{
              res.json({ status: false, error:"Insufficient Balance" });
            }

          }else{
            res.json({ status: false, error:"Bet Amount should be greater than or equal to Min Amount" });
          }

        }else{
          res.json({ status: false, error:"Bet Amount should be less than Max Amount" });
        }
      }else{
        res.json({ status: false, error:"Insufficient Balance" });
      }
    }else{
      res.json({ status: false, error:"Invalid User" });
    }
  }

  }
  catch(e){
    res.json({ status: false });
    console.log("placebet", e);
  }

});

 


router.post("/add_dice", common.tokenMiddleware, async function(req, res) {
  var data = req.body;
  try {
    var diceData = await dice.create(data);
    if (diceData) {
      res.json({ status: true, msg: "Created Successfully!" });
    } else {
      res.json({ status: false, msg: "Unable to Create" });
    }
  } catch (e) {
    res.json({ status: false });
    console.log("add_dice", e);
  }
});

router.post("/dice_list", common.tokenMiddleware, async function(req, res) {
  var data = req.body;
  try {
    var diceData = await dice
      .find({ userId: data.userId })
      .sort({ _id: -1 })
      .limit(20);
    if (diceData) {
      res.json({ status: true, data: diceData });
    } else {
      res.json({ status: false, msg: "Unable to get list" });
    }
  } catch (e) {
    res.json({ status: false });
    console.log("dice_list", e);
  }
});



router.post("/dice_userlist", common.tokenMiddleware, async function(req, res) {
  var data = req.body;
  try {
    var diceData = await dice.find({ userId: data.userId }).sort({ _id: -1 });
    if (diceData) {
      res.json({ status: true, data: diceData });
    } else {
      res.json({ status: false, msg: "Unable to get list" });
    }
  } catch (e) {
    res.json({ status: false });
    console.log("dice_list", e);
  }
});

router.get("/dice_listByProfit", common.whitelistMiddleware, async function(
  req,
  res
) {
  var data = req.body;
  try {
    var diceData = await dice.find({ status: 1 }).sort({ payout: -1 });
    if (diceData) {
      res.json({ status: true, data: diceData });
    } else {
      res.json({ status: false, msg: "Unable to get list" });
    }
  } catch (e) {
    res.json({ status: false });
    console.log("dice_listByProfit", e);
  }
});

router.get("/get_totalBet", common.whitelistMiddleware, async function(req, res) {
  try {
    var totalData = await dice.aggregate([
      { $match: { status: 1 } },
      { $group: { _id: null, amount: { $sum: "$betAmount" } } }
    ]);
    res.json({ status: true, data: totalData[0].amount });
  } catch (e) {
    res.json({ status: false });
    console.log("get_totalBet", e);
  }
});


function randomGeneration(diceData) {
  var min = Math.ceil(0);
  var max = Math.floor(diceData.winnercount - 1);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
async function savedicedata(data,winStatus,multiplier,profit,profitToWin,userbal,winningChance) {
  var sitesett = await siteSettings.findOne();
  var divisett = await diviSettings.findOne();
  var dicesett = await diceSettings.findOne();

  if(winStatus){


    set = {$inc:{"wallet.$.amount": profitToWin}};
    var profit_upd   =  parseFloat(profit) - parseFloat(data.amount);

    var user_ref = await user_detail.findOne({user_id:data.user_id}).lean();
    if(user_ref && user_ref.invitedBy!=""){
      var usr_det = await user_detail.findOne({_id:user_ref.invitedBy}).lean();
      var ref_percent = parseFloat(sitesett.referal_percent/100)*profit_upd;
      var recve_amt = Number(ref_percent).toFixed(5);
      if(ref_percent>0){
        var refData = {
            userId: data.user_id,
            ruserId: usr_det.user_id,
            game:"Dice",
            bet_amount: data.amount,
            win_amount:profit,
            commission_per:sitesett.referal_percent,
            received_amount:recve_amt
        }
        var ins_Data = await referalshare.create(refData);
      }
    }

    var real_org = parseFloat(divisett.pool_amount);
    var fake_org = parseFloat(divisett.fake_pool_amount);
    var updated_pool =  parseFloat(divisett.pool_amount)-parseFloat(profit_upd);
    var update_fake_pool =  parseFloat(divisett.fake_pool_amount)-parseFloat(profit_upd);
    var in_amt = 0;
    var out_amt = parseFloat(profit_upd);
    var real_mod = parseFloat(updated_pool);
    var fake_mod = parseFloat(update_fake_pool);

    let updatedivi = await diviSettings.updateOne({_id:divisett._id},{$set:{pool_amount:updated_pool,fake_pool_amount:update_fake_pool}});
    let updatedSettings = await diviSettings.findOne({_id:divisett._id}).lean();
    let getProfit = await common.update_profit(data.user_id);
    io.emit('getdivi',{'diviSettings':updatedSettings,'profit':getProfit,'address':data.userId});
    await wallet.update({user_id:data.user_id, "wallet.currency": "TRX"},set);
    io.emit('getBal',userbal);



  }
  else{
      var real_org = parseFloat(divisett.pool_amount);
      var fake_org = parseFloat(divisett.fake_pool_amount);
      var updated_pool =  parseFloat(divisett.pool_amount)+parseFloat(data.amount);
      var update_fake_pool =  parseFloat(divisett.fake_pool_amount)+parseFloat(data.amount);
      var out_amt = 0;
      var in_amt = parseFloat(data.amount);
      var real_mod = parseFloat(updated_pool);
      var fake_mod = parseFloat(update_fake_pool);

      let updatedivi = await diviSettings.updateOne({_id:divisett._id},{$set:{pool_amount:updated_pool,fake_pool_amount:update_fake_pool}});
      let updatedSettings = await diviSettings.findOne({_id:divisett._id}).lean();
      let getProfit = await common.update_profit(data.user_id);
      io.emit('getdivi',{'diviSettings':updatedSettings,'profit':getProfit,'address':data.userId});
  }   

  var diceData = {
        prediction: data.prediction,
        luckyNumber: data.luckyNumber,
        betAmount: data.amount,
        multiplier:multiplier,
        payout:profit,
        status:winStatus ? 1 : 0,
        userId:data.user_id,
        rollStatus:data.rollStatus == 'over' ? '>' : '<' 
    }

  var poolData_create = {
    userid:data.user_id,
    game:'Dice',
    betamount:data.amount,
    win:winStatus ? 1 : 0,
    in_amt:in_amt,
    out_amt:out_amt,
    real_org:real_org,
    fake_org:fake_org,
    real_mod:real_mod,
    fake_mod:fake_mod,
    shared_percentage:0,
    shared_amount:0

  }  
                    
  var diceData = await dice.create(diceData);
  var poolData = await share.create(poolData_create);
  let betData = {userId:data.user_id,betAmount:data.amount,game_type:1};
  let plttkn = await common.placeToken(betData);
  return 'success';
  
}

async function table_rand(prediction) {
  var arr = [];
  var perct = parseInt(100) - parseInt(prediction);
  while(arr.length < perct){
      var r = Math.floor(Math.random() * 100) + 1;
      if(arr.indexOf(r) === -1) arr.push(r);
  }
  return arr.toString();
  }

  async function table_random(win_reduce) {
  var arr = [];
  while(arr.length < win_reduce){
      var r = Math.floor(Math.random() * 100) + 1;
      if(arr.indexOf(r) === -1) arr.push(r);
  }
  return arr.toString();
  }

  async function table_rand_new(win_reduce,alry_rand) {
  var arr = [];
  var split_str = alry_rand.split(",");
  while(arr.length < win_reduce){
      var r = Math.floor(Math.random() * 100) + 1;
      if(arr.indexOf(r) === -1 && split_str.indexOf(r) === -1) arr.push(r);
  }
  return arr.toString();
  }

async function tableRandom(data, diceSettings) {
  let random = [];
  if (data.level == "1") {
    var percent =
      (diceSettings.firstlevel_percent / 100) * diceSettings.winnercount -
      diceSettings.winnercount;
  } else if (data.level == "2") {
    var percent =
      (diceSettings.secondlevel_percent / 100) * diceSettings.winnercount -
      diceSettings.winnercount;
  } else {
    var percent =
      (diceSettings.thirdlevel_percent / 100) * diceSettings.winnercount -
      diceSettings.winnercount;
  }
  for (let i = 0; i < Math.abs(percent); i++) {
    let randomNumber = await randomGeneration(diceSettings);
    random.push(randomNumber);
  }
  return random.toString();
}

router.post("/add_levels", common.whitelistMiddleware, async function(req, res) {
  let data = req.body;
  try {
    let diceData = await diceLevel
      .findOne({ userId: data.userId, level: data.level })
      .lean();
    let getDiceSettings = await diceSettings.findOne({}).lean();
    if (!diceData) {
      data.random = await tableRandom(data, getDiceSettings);
      let insertDiceLevel = await diceLevel.create(data);
      res.json({ status: true, data: insertDiceLevel });
    } else {
      if (diceData.count == getDiceSettings.winnercount) {
        let randomNumber = await tableRandom(diceData, getDiceSettings);
        var set = { $set: { count: 0, random: randomNumber } };
      } else {
        var set = { $inc: { count: 1 } };
      }
      let updateDiceLevel = await diceLevel.update(
        { userId: data.userId, level: data.level },
        set
      );
      let diceUpdatedData = await diceLevel
        .findOne({ userId: data.userId, level: data.level })
        .lean();
      res.json({ status: false, data: diceUpdatedData });
    }
  } catch (e) {
    res.json({ status: false });
    console.log("add_levels", e);
  }
});

module.exports = router;
