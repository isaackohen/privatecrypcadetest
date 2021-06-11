const express = require('express')
const router = express.Router();
const aboutUs = require('../model/db/Aboutus');
const common = require('../helpers/common');

router.get('/get_aboutus', common.whitelistMiddleware, async (req, res) => {
	try {
		const data = await aboutUs.find();
		res.json({ status: true, data });
	} catch (error) {
		res.json({ status : false });
		console.log('get_aboutus', error);
	}
}); 

router.post('/add_aboutus',common.whitelistMiddleware, async (req, res) => {
	const data = req.body;
	try {
		if (data._id) {
			await aboutUs.update({_id:data._id},{$set:data});
			res.json({ status: true, msg: 'Updated Successfully!' });
		} else {
			const createAboutUs = await aboutUs.create(data);
			if(createAboutUs){
				res.json({ status: true, msg: 'Created Successfully!' });
			} else {
				res.json({ status: false, msg: 'Unable to Create' });
			}
		}
	} catch (error) {
		res.json({ status : false });
		console.log('add_aboutus', error);
	}
});

router.get('/get_aboutusList', common.whitelistMiddleware, async (req, res) => {
	try {
		const data = await aboutUs.find({status:1});
		res.json({ status: true, data });
	} catch (error) {
		res.json({ status : false });
		console.log('get_aboutus', error);
	}
});

module.exports = router;