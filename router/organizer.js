const express = require("express");
var mongoose = require("mongoose");
const router = express.Router();
var async = require("async");
var sha1Hex = require("sha1-hex");
const CryptoJS = require("crypto-js");
var crypto = require("crypto");
const request = require("request");
var config = require("../config");
var key = CryptoJS.enc.Base64.parse("#base64Key#");
const fetch = require("node-fetch");
var iv = CryptoJS.enc.Base64.parse("#base64IV#");
let common = require("../helpers/common");
var generator = require("generate-password");
let mail = require("../helpers/mailHelper");
var getJSON = require("get-json");
const BalancesService = require("../services/balances");
let salt = config.endorphina.salt;

const { dbModel } = require("../model/db");

let apiresponse = {
  status: 200,
  message: "",
  data: [],
  cmscount: 0,
};

router.get("/get_detail", common.whitelistMiddleware, async function (
  req,
  res
) {
  try {
    var resData = await dbModel.admin.findOne({}).lean();
    res.json(resData);
  } catch (e) {
    res.json({ status: false });
    console.info("get_admindetail", e);
  }
});

router.get("/get_poolbalance", async function (req, res) {
  try {
    var resData = await dbModel.dividendSettings.findOne({}).lean();
    if (resData) {
      res.json({
        trxpoolamount: resData.fake_pool_amount,
        maticpoolamount: resData.matic_fake_pool_amount,
      });
    }
  } catch (e) {
    res.json({ status: false });
    console.info("get_admindetail", e);
  }
});

router.post("/geturl", common.whitelistMiddleware, async (req, res) => {
  fetch(req.body.filename)
    .then((resp) => resp.text())
    .then(function (data) {
      if (data) {
        res.json({ data });
      } else {
        res.json({ status: false });
      }
    });
});

router.post("/getsha", common.whitelistMiddleware, async (req, res) => {
  let data = req.body;
  let cal_str = data.exit + data.nodeId + data.token + salt;
  var sha_res = sha1Hex(cal_str);
  if (sha_res) {
    res.json({ status: true, data: sha_res });
  } else {
    res.json({ status: false });
  }
});

router.get("/get_ip", common.whitelistMiddleware, async (req, res) => {
  try {
    var ip = req.ip.replace("::ffff:", "");
    let ipData = await dbModel.ipManagement.findOne({ ip: ip }).lean();
    if (ipData) {
      res.json({ status: false, data: ipData });
    } else {
      let data1 = await dbModel.ipManagement.create({ ip: ip });
      res.json({ status: true });
    }
  } catch (e) {
    res.json({ status: false });
    console.log("get_ip", e);
  }
});

router.get("/testIpAddr", (req, res) => {
  let ip = req.headers;
  let rem = req.connection.remoteAddress;
  res.json({ success: 1, ip: ip, rem: rem });
});

router.get("/get_country", common.whitelistMiddleware, async (req, res) => {
  try {
    let ipaddr = req.header("x-forwarded-for") || req.connection.remoteAddress;
    var ip = ipaddr.replace("::ffff:", "");
    getJSON("https://ipinfo.io/" + ip, function (err, response) {
      if (response) {
        res.json({ status: true, data: response });
      } else {
        res.json({ status: false });
      }
    });
  } catch (e) {
    res.json({ status: false });
    console.log("get_ip", e);
  }
});

router.post("/block_ip", common.whitelistMiddleware, async (req, res) => {
  let data = req.body;
  try {
    if (data._id) {
      let data1 = await dbModel.ipManagement.update(
        { _id: data._id },
        { $set: { status: data.status } }
      );
      res.json({ status: true, msg: "Updated Successfully" });
    } else {
      var ip = await dbModel.ipManagement.findOne({ ip: data.ip });
      if (ip) {
        return res.json({
          status: false,
          msg: "Ip address is already registered",
        });
      }
      var ipData = await dbModel.ipManagement.create(data);
      if (ipData) {
        res.json({ status: true, msg: "Created Successfully!" });
      } else {
        res.json({ status: false, msg: "Unable to Create" });
      }
    }
  } catch (e) {
    res.json({ status: false });
    console.log("get_ipaddress", e);
  }
});

router.post("/block_user", common.whitelistMiddleware, async (req, res) => {
  let data = req.body;
  try {
    if (data._id) {
      let data1 = await dbModel.userManagement.update(
        { _id: data._id },
        { $set: { status: data.status } }
      );
      io.emit("get_blockuser", data1);
      res.json({ status: true, msg: "Updated Successfully" });
    } else {
      var user = await dbModel.userManagement.findOne({
        user_address: data.user_address,
      });
      if (user) {
        return res.json({
          status: false,
          msg: "User Address already registered",
        });
      }
      var userData = await dbModel.userManagement.create(data);
      if (userData) {
        res.json({ status: true, msg: "Created Successfully!" });
        io.emit("get_blockuser", data1);
      } else {
        res.json({ status: false, msg: "Unable to Create" });
      }
    }
  } catch (e) {
    res.json({ status: false });
    console.log("block_user", e);
  }
});

router.get("/get_ipaddress", common.whitelistMiddleware, async (req, res) => {
  try {
    let data = await dbModel.ipManagement.find();
    res.json({ status: true, error: data });
  } catch (e) {
    res.json({ status: false });
    console.log("get_ipaddress", e);
  }
});

router.get("/get_useraddress", common.whitelistMiddleware, async (req, res) => {
  try {
    let data = await dbModel.userManagement.find();
    res.json({ status: true, error: data });
  } catch (e) {
    res.json({ status: false });
    console.log("get_useraddress", e);
  }
});

var data = [];
// router.get('/getdata',async function(req,res){
//  try{
//      let diffBalance;
//      let getdata = await wallet.aggregate([{$lookup: {from: "tokenMining", localField: "user_id", foreignField: "userId",  as: "tokenMining"}},{$lookup: {from: "Users", localField: "user_id", foreignField: "user_id",  as: "user_docs"}}]);
//         let count=0;
//            if(getdata.length>0){
//                 count=getdata.length;
//            }
//            getdata.forEach(async function(item){
//             var data1=item.wallet[0];
//             data1.user_id=item.user_id;
//             data1.user_name = item.user_docs[0].user_name;
//             data1.user_image = item.user_docs[0].user_image;
//             data1.user_rank = item.user_docs[0].rank;
//             data1.user_rankname = item.user_docs[0].rankName;
//             data1._id = item._id;
//             var tokendata=item.tokenMining;
//             if(tokendata.length > 0){
//                  tokendata[0].Cad_token.forEach(async function(titem){
//                      var type=titem.type;
//                      data1[type] = titem.amount;
//                  })
//             diffBalCalc(data1,count,res);

//             }else{
//                  data1.claim = 0;
//                  data1.mined = 0;
//                  data1.freeze = 0;
//                  data1.unfreeze = 0;

//                  diffBalCalc(data1,count,res);
//             }
//         })

//  }catch(e){
//   console.log("error",e)
//  }
// })

// async function diffBalCalc(data1,count,res){
// 	Deposit.aggregate([{$match:{userId:data1.user_id,status:1}},{$group:{_id:null,totaldeposit:{$sum:"$amount"}}}],(err,value)=>{
// 		Withdraw.aggregate([{$match:{userId:data1.user_id,status:1}},{$group:{_id:null,totalwithdraw:{$sum:"$amount"}}}],(err,value1)=>{
// 			if(value1.length==0 && value.length>0){
// 		   		data1.totalvalue=value[0].totaldeposit/1000000;
// 		   		data.push(data1)
// 		   		 if(data.length==count){
// 		   			res.json({status:true,data,count:count})
// 		   			data=[];
// 		  		 }
// 		   	}else {
// 		   		if(value.length>0){
// 		   			let divided=value[0].totaldeposit-value1[0].totalwithdraw;
// 			   		data1.totalvalue=divided/1000000;
// 			   		data.push(data1)
// 			   		 if(data.length==count){
// 			   			return res.json({status:true,data,count:count})
// 			   			data=[];
// 			   		}
// 		   		}else{
// 		   			data1.totalvalue=0;
// 			   		data.push(data1)
// 			   		 if(data.length==count){
// 			   			return res.json({status:true,data,count:count})
// 			   			data=[];
// 			   		}
// 		   		}
// 		   	}
// 	 	});
// 	});
// }

router.get("/getdata", async function (req, res) {
  try {
    let getdata = await dbModel.wallet.aggregate([
      {
        $lookup: {
          from: "Users",
          localField: "user_id",
          foreignField: "user_id",
          as: "user_docs",
        },
      },
      { $unwind: "$user_docs" },
      {
        $lookup: {
          from: "tokenMining",
          localField: "user_id",
          foreignField: "userId",
          as: "tokenMining",
        },
      },
      { $unwind: "$tokenMining" },
      {
        $lookup: {
          from: "Deposit",
          localField: "user_id",
          foreignField: "userId",
          as: "Deposit",
        },
      },
      {
        $lookup: {
          from: "Withdraw",
          localField: "user_id",
          foreignField: "userId",
          as: "Withdraw",
        },
      },
    ]);
    // console.log("sdfgsfdgsdfsgdfs",getdata);
    let count = 0;
    if (getdata && getdata.length > 0) {
      count = getdata.length;
    }
    for (let i = 0; i < getdata.length; i++) {
      getdata[i].totaldeposit = 0;
      for (let am = 0; am < getdata[i].tokenMining.Cad_token.length; am++) {
        getdata[i][getdata[i].tokenMining.Cad_token[am].type] =
          getdata[i].tokenMining.Cad_token[am].amount;
      }
      for (let j = 0; j < getdata[i].Deposit.length; j++) {
        getdata[i].totaldeposit =
          getdata[i].Deposit[j].amount + getdata[i].totaldeposit;
      }
    }
    for (let i = 0; i < getdata.length; i++) {
      getdata[i].totalwithdraw = 0;
      for (let j = 0; j < getdata[i].Withdraw.length; j++) {
        getdata[i].totalwithdraw =
          getdata[i].Withdraw[j].amount + getdata[i].totalwithdraw;
      }
    }
    res.json({ status: true, data: getdata });
  } catch (e) {
    console.log("error", e);
  }
});

// function deposit(depdata,k,callback){
// 	console.log("checkkkkk deposit")
// 	let depositamt=0;
// 	if(depdata.length>0){
// 		if(depdata[k].status==1){
// 			depositamt=depositamt+depdata[k].amount;
// 			k++;
// 		}else{
// 			k++;
// 		}
// 		if(k==depdata.length){
// 			console.log("depositamt if",depositamt)
// 			callback(depositamt)
// 		}
// 	}else{
// 		console.log("depositamt else",depositamt)
// 		callback(depositamt)
// 	}
// }

// function withdraw(wdata,w,callback){
// 	console.log("withdraw checkkkk")
// 	let withdrawamt=0;
// 	if(wdata.length>0){
// 		if(wdata[w].status==1){
// 			withdrawamt=withdrawamt+wdata[w].amount;
// 			w++;
// 		}else{
// 			w++;
// 		}
// 		if(w==wdata.length){
// 			console.log("withdrawamt if",withdrawamt)
// 			callback(withdrawamt)
// 		}
// 	}else{
// 		console.log("withdrawamt else",withdrawamt)
// 		callback(withdrawamt)
// 	}
// }
// router.post('/forgetPwdAdmin', (req, res) => {
// 	try{
// 		var datas = {},
// 		values = req.body;

// 		admin.find(values).exec(function(err,resData){
// 			if(resData.length == 0) {
// 				res.json({
// 					status : false,
// 					msg    : "no_mail",
// 					error : "Email id does not belong to our website"
// 				});
// 			}
// 			else{
// 				if(resData[0].status == 1){
// 					res.json({ status : false , error : "You have been deactivated by admin"});
// 				}
// 				else{
// 					var cipher = crypto.createCipheriv('aes-256-ctr', 'T1Bt0Lx5jA9ML6AJ8523IAv0anRd03Ya', 'S19h8AnT21H8n14I')
// 					var crypted = cipher.update(resData[0]._id.toString(), 'utf8', 'hex')
// 					crypted += cipher.final('hex');
// 					var link = config.adminhost+'reset-password/'+crypted
// 					admin.updateOne(values,{ "$set": {"reset_password": 1,"reset_password_timer":new Date()}},{new: true}).exec(function(err, resUpdate){
// 						emailDB.findOne({ "title": 'forgotpwd' }).exec(function(etemperr,etempdata){
// 							var etempdataDynamic = etempdata.mailcontent.replace(/###LINK###/g, link).replace(/###EMAIL###/g, req.body.admin_emailid);
// 							mail.sendMail({ to: req.body.admin_emailid, subject: etempdata.mailsubject, html: etempdataDynamic },function(mailRes){
// 								res.json({ status : true , success    : "success",});
// 							});
// 						});
// 					});
// 				}
// 			}
// 		});
// 	}
// 	catch(e)
// 	{
// 		console.info("forgetPwdAdmin", e)
// 	}
// })

router.post("/forgetPwdAdmin", common.whitelistMiddleware, (req, res) => {
  try {
    var datas = {},
      values = req.body;

    dbModel.admin.find(values).exec(function (err, resData) {
      if (resData.length == 0) {
        res.json({
          status: false,
          msg: "no_mail",
          error: "Email id does not belong to our website",
        });
      } else {
        if (resData[0].status === 1) {
          res.json({
            status: false,
            error: "You have been deactivated by admin",
          });
        } else {
          var cipher = crypto.createCipheriv(
            "aes-256-ctr",
            "T1Bt0Lx5jA9ML6AJ8523IAv0anRd03Ya",
            "S19h8AnT21H8n14I"
          );
          var crypted = cipher.update(resData[0]._id.toString(), "utf8", "hex");
          crypted += cipher.final("hex");
          var link = config.adminhost + "reset-password/" + crypted;
          dbModel.admin
            .updateOne(
              values,
              { $set: { reset_password: 1, reset_password_timer: new Date() } },
              { new: true }
            )
            .exec(function (err, resUpdate) {
              dbModel.emailTemplate
                .findOne({ title: "forgotpwd" })
                .exec(function (etemperr, etempdata) {
                  var etempdataDynamic = etempdata.mailcontent.replace(
                    /###LINK###/g,
                    link
                  );
                  mail.sendMail(
                    {
                      to: req.body.admin_emailid,
                      subject: etempdata.mailsubject,
                      html: etempdataDynamic,
                    },
                    function (mailRes) {
                      res.json({ status: true, success: "success" });
                    }
                  );
                });
            });
        }
      }
    });
  } catch (e) {
    res.json({ status: false });
    console.info("forgetPwdAdmin", e);
  }
});

router.post("/check_time", common.whitelistMiddleware, (req, res) => {
  try {
    var cipher = crypto.createDecipheriv(
      "aes-256-ctr",
      "T1Bt0Lx5jA9ML6AJ8523IAv0anRd03Ya",
      "S19h8AnT21H8n14I"
    );
    var crypted = cipher.update(req.body._id, "hex", "utf8");
    crypted += cipher.final("utf8");
    dbModel.admin.findOne({ _id: crypted }).exec(function (err, resData) {
      if (resData == null) {
        res.json({ success: false });
      } else if (resData.reset_password == 0) {
        res.json({ success: false });
      } else {
        var today = new Date(req.body.current_date);
        var Christmas = new Date(resData.reset_password_timer);
        var diffMs = today - Christmas;
        var diffDays = Math.floor(diffMs / 86400000); // days
        var diffHrs = Math.floor((diffMs % 86400000) / 3600000); // hours
        var diffMins = Math.round(((diffMs % 86400000) % 3600000) / 60000); // minutes
        if (diffDays == 0 && diffHrs == 0 && diffMins <= 15) {
          res.json({ success: true, data: resData });
        } else {
          res.json({ success: false });
        }
      }
    });
  } catch (e) {
    res.json({ status: false });
    console.info("check_time", e);
  }
});

router.post("/send_failed_otp", common.whitelistMiddleware, async function (
  req,
  res
) {
  try {
    var admin_det = await dbModel.admin.findOne({}).lean();
    dbModel.admin.findOne({ _id: admin_det._id }).exec(function (err, resData) {
      if (resData == null) {
        res.json({ success: false });
      } else {
        var password = generator.generate({
          length: 10,
          numbers: true,
          uppercase: true,
        });
        dbModel.admin
          .updateOne(
            { _id: admin_det._id },
            { $set: { failed_otp: password, reset_otp_timer: new Date() } }
          )
          .exec(function (err, resData1) {
            dbModel.emailTemplate
              .findOne({ title: "OTP" })
              .exec(function (etemprErr, etempdata) {
                var etempdataDynamic = etempdata.mailcontent
                  .replace(/###OTP###/g, password)
                  .replace(/###EMAIL###/g, resData.admin_emailid);
                mail.sendMail(
                  {
                    to: admin_det.admin_emailid,
                    subject: etempdata.mailsubject,
                    html: etempdataDynamic,
                  },
                  function (mailRes) {
                    res.json({ success: true });
                  }
                );
              });
          });
      }
    });
  } catch (e) {
    res.json({ status: false });
    console.info("send_failed_otp", e);
  }
});

router.post("/check_opt_failed", common.whitelistMiddleware, async function (
  req,
  res
) {
  try {
    var admin_det = await dbModel.admin.findOne({}).lean();
    var today = new Date();
    var reset_date = new Date(admin_det.reset_otp_timer);
    var diffMs = today - reset_date;
    var diffDays = Math.floor(diffMs / 86400000); // days
    var diffHrs = Math.floor((diffMs % 86400000) / 3600000); // hours
    var diffMins = Math.round(((diffMs % 86400000) % 3600000) / 60000); // minutes
    if (admin_det.failed_otp == req.body.new_pwd) {
      if (diffDays == 0 && diffHrs == 0 && diffMins <= 15) {
        res.json({ status: true });
      } else {
        res.json({ status: false, msg: "Your OTP Expired. Try with new OTP" });
      }
    } else {
      res.json({ status: false, msg: "Invalid OTP" });
    }
  } catch (e) {
    res.json({ status: false });
    console.info("check_opt_failed", e);
  }
});

router.post("/check_subadmin", common.whitelistMiddleware, (req, res) => {
  try {
    var cipher = crypto.createDecipheriv(
      "aes-256-ctr",
      "T1Bt0Lx5jA9ML6AJ8523IAv0anRd03Ya",
      "S19h8AnT21H8n14I"
    );
    var crypted = cipher.update(req.body._id, "hex", "utf8");
    crypted += cipher.final("utf8");
    dbModel.admin.findOne({ _id: crypted }).exec(function (err, resData) {
      if (resData == null) {
        res.json({ success: false });
      } else if (resData.set_password == 1) {
        res.json({ success: false });
      } else {
        res.json({ success: true, data: resData });
      }
    });
  } catch (e) {
    res.json({ status: false });
    console.info("check_subadmin", e);
  }
});

router.post("/resetpassword", common.whitelistMiddleware, (req, res) => {
  console.log(req.body, "reqqqqqqqqqqqqqqqqqq");
  try {
    var encryptednewpass = CryptoJS.AES.encrypt(req.body.new_pwd, key, {
      iv: iv,
    }).toString();
    dbModel.admin
      .updateOne(
        { _id: req.body._id },
        { $set: { reset_password: 0, admin_password: encryptednewpass } }
      )
      .exec(function (err, resData) {
        res.json({ status: true });
      });
  } catch (e) {
    res.json({ status: false });
    console.info("resetpassword", e);
  }
});

router.post("/setnewpassword", common.whitelistMiddleware, (req, res) => {
  try {
    var encryptednewpass = CryptoJS.AES.encrypt(req.body.new_pwd, key, {
      iv: iv,
    }).toString();
    dbModel.admin
      .updateOne(
        { _id: req.body._id },
        { $set: { set_password: 1, admin_password: encryptednewpass } }
      )
      .exec(function (err, resData) {
        res.json({ status: true });
      });
  } catch (e) {
    res.json({ status: false });
    console.info("setnewpassword", e);
  }
});

router.post("/checkLogin", common.whitelistMiddleware, (req, res) => {
  try {
    var g = req.body.raw3;
    var values = req.body;
    var encerypt_id = req.body.raw3;
    var deOtp = CryptoJS.AES.decrypt(encerypt_id, key, { iv: iv });
    var OTP = deOtp.toString(CryptoJS.enc.Utf8);
    var category = OTP;
    dbModel.admin
      .find({
        admin_emailid: req.body.admin_emailid,
        admin_password: req.body.admin_password,
      })
      .exec(function (err, resData) {
        if (err) return res.status(500).send(err);
        if (resData.length > 0) {
          console.log(resData[0], "dddadasdfasdfsdfadfasdf");
          if (resData[0].admin_pattern == req.body.admin_pattern) {
            // if(resData[0].failed < 5){
            if (resData[0].status == 1) {
              datas = {
                status: false,
                error: "You have been deactivated by admin",
              };
              res.json(datas);
            } else {
              var r = require("ua-parser").parse(req.headers["user-agent"]);
              var ip = req.ip.replace("::ffff:", "");
              let place;
              request("http://ip-api.com/json", (error, response, body) => {
                if (error) {
                  place = "";
                }
                if (body) {
                  let loc = JSON.parse(body);
                  let country = loc.country;
                  let city = loc.city;
                  if (city == "" && country != "") {
                    place = country;
                  } else if (city != "" && country == "") {
                    place = city;
                  } else {
                    place = city + "," + country;
                  }
                }
                console.log(ip);
                var mydata = {
                  user_id: resData[0]._id,
                  ip: ip,
                  location: place,
                  browser: r.ua.toString(),
                  os: r.os.toString(),
                  type: "Login",
                };
                var mydatas = new dbModel.adminActivity(mydata);
                mydatas.save();
                datas = {
                  status: true,
                  data: resData[0],
                  session: resData[0]._id,
                  name: resData[0].admin_name,
                  role: resData[0].role,
                  success: "You are logging in. Please Wait",
                };
                res.json(datas);
              });
            }
            // }
            // else{
            //  datas = {
            //      status : false,
            //      error  : "Enter otp in link to activate the user"
            //  };
            //  res.json(datas);
            // }
          } else {
            if (resData[0].failed >= 5) {
              var cipher = crypto.createCipheriv(
                "aes-256-ctr",
                "T1Bt0Lx5jA9ML6AJ8523IAv0anRd03Ya",
                "S19h8AnT21H8n14I"
              );
              var crypted = cipher.update(
                resData[0]._id.toString(),
                "utf8",
                "hex"
              );
              crypted += cipher.final("hex");
              var link = config.adminhost + "otp-verification/" + crypted;
              dbModel.emailTemplate
                .findOne({ title: "failed" })
                .exec(function (etemperr, etempdata) {
                  // var etempdataDynamic = etempdata.mailcontent.replace(/###PASSWORD###/g, link).replace(/###EMAIL###/g, req.body.admin_emailid);
                  // mail.sendMail({ to: req.body.admin_emailid, subject: etempdata.mailsubject, html: etempdataDynamic },function(mailRes){
                  //     datas = {
                  //         status : false,
                  //         error  : "Enter otp in link to activate the user"
                  //     };
                  //     res.json(datas);
                  // });
                });
            } else {
              var i = resData[0].failed;
              i += 1;
              dbModel.admin
                .updateOne(
                  { admin_emailid: req.body.admin_emailid },
                  { $set: { failed: i } }
                )
                .exec(function (err, resData1) {
                  datas = {
                    status: false,
                    error: "Invalid Patternlock",
                  };
                  res.json(datas);
                });
            }
          }
        } else {
          dbModel.admin
            .find({ admin_emailid: req.body.admin_emailid })
            .exec(function (err, resData1) {
              if (resData1.length == 0) {
                datas = {
                  status: false,
                  error: "Invalid Email id",
                };
                res.json(datas);
              } else {
                if (resData1[0].admin_password != req.body.admin_password) {
                  if (resData1[0].failed >= 5) {
                    var cipher = crypto.createCipheriv(
                      "aes-256-ctr",
                      "T1Bt0Lx5jA9ML6AJ8523IAv0anRd03Ya",
                      "S19h8AnT21H8n14I"
                    );
                    var crypted = cipher.update(
                      resData1[0]._id.toString(),
                      "utf8",
                      "hex"
                    );
                    crypted += cipher.final("hex");
                    var link = config.adminhost + "otp-verification/" + crypted;
                    dbModel.emailTemplate
                      .findOne({ title: "failed" })
                      .exec(function (etemperr, etempdata) {
                        var etempdataDynamic = etempdata.mailcontent
                          .replace(/###PASSWORD###/g, link)
                          .replace(/###EMAIL###/g, req.body.admin_emailid);
                        mail.sendMail(
                          {
                            to: req.body.admin_emailid,
                            subject: etempdata.mailsubject,
                            html: etempdataDynamic,
                          },
                          function (mailRes) {
                            datas = {
                              status: false,
                              error: "Enter otp in link to activate the user",
                            };
                            res.json(datas);
                          }
                        );
                      });
                  } else {
                    datas = {
                      status: false,
                      error: "Invalid password",
                    };
                    res.json(datas);
                    // var i = resData1[0].failed;
                    // i +=1;
                    // admin.updateOne({admin_emailid : req.body.admin_emailid},{$set:{failed:i}}).exec(function(err,resData1){
                    //     datas = {
                    //         status : false,
                    //         error  : "Invalid password"
                    //     };
                    //     res.json(datas);
                    // })
                  }
                }
              }
            });
        }
      });
  } catch (e) {
    res.json({ status: false });
    console.info("checkLogin", e);
  }
});

router.post("/change", common.whitelistMiddleware, (req, res) => {
  try {
    dbModel.admin.findOne({ _id: req.body.idd }, function (err, resData) {
      if (err) return handleError(err);
      if (resData.admin_password == req.body.pass) {
        dbModel.admin.updateOne(
          { _id: req.body.idd },
          { $set: { admin_password: req.body.npass } },
          function (err, resupdate) {
            if (err) return handleError(err);
            res.json({
              success: true,
            });
          }
        );
      } else {
        res.json({
          success: false,
        });
      }
    });
  } catch (e) {
    res.json({ status: false });
    console.info("change", e);
  }
});

router.post("/get_admindetail", common.whitelistMiddleware, (req, res) => {
  try {
    dbModel.admin.findOne(
      { _id: req.body._id },
      { admin_password: 0 },
      function (err, resData) {
        res.json(resData);
      }
    );
  } catch (e) {
    res.json({ status: false });
    console.info("get_admindetail", e);
  }
});

router.post("/update_info", common.whitelistMiddleware, (req, res) => {
  try {
    dbModel.admin.updateOne(
      { _id: req.body.idd },
      {
        $set: {
          admin_emailid: req.body.mail,
          admin_name: req.body.name,
          admin_pattern: req.body.pattern,
        },
      },
      function (err, resupdate) {
        if (err) return handleError(err);
        res.json({
          success: true,
        });
      }
    );
  } catch (e) {
    res.json({ status: false });
    console.info("update_info", e);
  }
});

router.post("/getallactivity", common.whitelistMiddleware, (req, res) => {
  try {
    var skip = req.body.page.pageNumber * req.body.page.size;
    var limit = req.body.page.size;
    let prop1 = req.body.sorting.prop;
    var dir = req.body.sorting["dir"];
    var srt = {};
    srt[prop1] = dir == "desc" ? -1 : 1;

    var cnt;
    var search = req.body.search;
    if (req.body.search != "") {
      cnt = {
        $and: [
          { user_id: { $regex: ".*" + req.body.id + ".*", $options: "i" } },
          { ip: { $regex: ".*" + search + ".*", $options: "i" } },
        ],
      };
    } else {
      cnt = { user_id: { $regex: ".*" + req.body.id + ".*", $options: "i" } };
    }

    async.parallel(
      {
        bannerTotalCount: function (cb) {
          dbModel.adminActivity.find(cnt).countDocuments().exec(cb);
        },
        bannerData: function (cb) {
          dbModel.adminActivity
            .find(cnt)
            .limit(limit)
            .skip(skip)
            .sort(srt)
            .exec(cb);
        },
      },
      function (err, results) {
        if (err) return res.status(500).send(err);
        apiresponse.data = [];
        apiresponse.status = true;
        apiresponse.data = results.bannerData;
        apiresponse.bannerTotalCount = results.bannerTotalCount;
        apiresponse.message = "";
        res.json(apiresponse);
      }
    );
  } catch (e) {
    res.json({ status: false });
    console.log("getfaqlist", e);
  }
});

router.get("/getactivity", common.whitelistMiddleware, async function (
  req,
  res
) {
  try {
    var adminActivity = await dbModel.adminActivity
      .find()
      .sort({ datetime: -1 });
    res.json({ status: true, data: adminActivity });
  } catch (e) {
    res.json({ status: false });
    console.log("getfaqlist", e);
  }
});

router.post("/updatestatus", common.whitelistMiddleware, (req, res) => {
  try {
    dbModel.admin.updateOne(
      { _id: req.body._id },
      { $set: { status: req.body.status } },
      function (err, resp) {
        res.json({ success: true });
      }
    );
  } catch (e) {
    res.json({ status: false });
    console.log("updatestatus", e);
  }
});

router.post("/createWallet", common.tokenMiddleware, async (req, res) => {
  const data = req.body;
  try {
    const wallet = await dbModel.wallet.findOne({ user_id: req.genuserId });
    if (!wallet) {
      const newWallet = {
        user_id: req.genuserId,
        trx_wallet: { currency: "TRX", amount: 0, address: req.genuserId },
        eth_wallet: { currency: "ETH", amount: 0, address: "" },
        matic_wallet: { currency: "MATIC", amount: 0, address: "" },
      };
      await dbModel.wallet.create(newWallet);
      res.json({ status: true, msg: "Wallet created successfully!" });
    }
  } catch (error) {
    res.json({ status: false });
    console.log("createWallet", error);
  }
});

router.post("/updateBalance", common.tokenMiddleware, async function (
  req,
  res
) {
  var data = req.body;
  try {
    await dbModel.wallet.update(
      { user_id: req.genuserId },
      { $set: { "trx_wallet.amount": data.amount } }
    );
    res.json({ status: true });
  } catch (e) {
    res.json({ status: false });
    console.log("updateBalance", e);
  }
});

router.post("/updatewallet", common.tokenMiddleware, async function (req, res) {
  var data = req.body;
  let set = {};

  // if(data.type == 'credit'){
  // 	set = {$inc:{"trx_wallet.amount":data.amount}};
  // }else{

  let balanceFromWallet = await dbModel.wallet.findOne({
    user_id: req.genuserId,
  });
  if (balanceFromWallet) {
    var updatebalance = data.amount;
    var walletbalance = balanceFromWallet.trx_wallet.amount;
    if (walletbalance >= updatebalance) {
      set = { $inc: { "trx_wallet.amount": -data.amount } };
    } else {
      res.json({ status: false });
      return false;
    }
  } else {
    res.json({ status: false });
    return false;
  }

  //}
  try {
    const wallet = await dbModel.wallet.update(
      { user_id: req.genuserId },
      set,
      { new: true }
    );
    res.json({ status: true, data: wallet });
  } catch (e) {
    res.json({ status: false });
    console.log("updatewallet", e);
  }
});

router.post("/getuserinfo", common.tokenMiddleware, async (req, res) => {
  try {
    let user_data = await dbModel.wallet.findOne({ user_id: req.genuserId });
    if (user_data) {
      res.json({ status: true, data: user_data });
    } else {
      res.json({ status: false });
    }
  } catch (error) {
    res.json({ status: false });
    console.log("getuserinfo", error);
  }
});

router.post("/getBalance", common.tokenMiddleware, async (req, res) => {
  const data = req.body;
  const userId = req.genuserId;
  try {
    const balancesService = new BalancesService();
    const balances = await balancesService.getWalletBalances(userId);
    let userbal = balances[data.token];
    res.json({ successCode: 0, balance: userbal });
  } catch (error) {
    console.log("getbalance", error);
  }
});

router.post("/getwalletBalance", common.tokenMiddleware, async function (
  req,
  res
) {
  const balancesService = new BalancesService();

  try {
    // const wallet = await dbModel.wallet.findOne({_id:req.genuserId});
    const balances = await balancesService.getWalletBalances(req.genuserId);

    res.json({
      status: true,
      trxbalance: balances.TRX,
      ethbalance: balances.ETH,
      maticbalance: balances.MATIC,
    });
  } catch (e) {
    res.json({ status: false });
    console.log("getBalance", e);
  }
});

router.post("/balPoolUpdate", common.tokenMiddleware, async function (
  req,
  res
) {
  let data = req.body;
  try {
    if (data.oldRank < data.newRank) {
      await dbModel.tokenMining.update(
        { userId: req.genuserId, "Cad_token.type": "claim" },
        { $inc: { "Cad_token.$.amount": data.amount } }
      );
    }
    res.json({ status: false });
  } catch (e) {
    res.json({ status: false });
  }
});

router.post("/addIncentive", common.tokenMiddleware, async function (req, res) {
  let data = req.body;
  try {
    let addData = await dbModel.incentiveRecord.create(data);
    if (addData) {
      res.json({ status: true, msg: "Added Successfully" });
    } else {
      res.json({ status: false });
    }
  } catch (e) {
    res.json({ status: false });
  }
});

router.post("/get_incentive", common.whitelistMiddleware, async function (
  req,
  res
) {
  try {
    let pageNo = req.body.pageNo;
    let size = parseInt(req.body.size);
    let query = {};
    if (pageNo > 0 && size > 0) {
      let skips = size * (pageNo - 1);
      let limits = size;
      let search = req.body.search;
      if (search) {
        query = { userId: { $regex: ".*" + search + ".*", $options: "i" } };
      }
      let totalCount = await dbModel.incentiveRecord.find(query).count();
      let incentive_data = await dbModel.incentiveRecord
        .find(query)
        .skip(skips)
        .limit(limits)
        .sort({ createddate: -1 })
        .lean();
      res.json({ status: true, data: incentive_data, count: totalCount });
    } else {
      res.json({ status: false, message: "Error fetching data" });
    }
  } catch (e) {
    res.json({ status: false });
  }
});

module.exports = router;
