const common = require('./common');
const sitesettingsDB = require('../model/db/framework');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
	host: 'smtp.gmail.com',
	port: 465,
	secure: true,
	auth: {
	  user: common.decrypt('9398a90cca56d302dff81f5af0b47db410814e7061fb62c143'),
	  pass: common.decrypt('ab9fb404e405cd5095')
	}	
});

module.exports = {
	sendMail : (values, callback) => {
		sitesettingsDB.findOne({}, (err, config) => {
			values.html = values.html.replace(/###fblink###/g, config.facebook).replace(/###twitterlink###/g, config.twitter).replace(/###youtube###/g, config.youtube);
			const mailOptions = {
				from: common.decrypt('9398a90cca56d302dff81f5af0b47db410814e7061fb62c143'),
		      	to: values.to,
			  	subject: values.subject,
			  	html: values.html,
			};

			transporter.sendMail(mailOptions, (error, info) => { error && console.log(error) });
	    	callback(true);
    	});
	}	
};

