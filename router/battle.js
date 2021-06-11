const express = require('express')
const router = express.Router();
const { dbModel } = require('../model/db');

//get battle data
router.post('/battleRecord', async (req, res) => {
	const data = req.body;

	try {
		if (!+data.pageNo || !+data.size) {
			res.json({status:false});
		}

		const skips = +data.size * (+data.pageNo - 1);
		const query = data.search ? {'userId': { $regex: '.*' + data.search + '.*',$options: 'i' }} : '';

		const count = await dbModel.battleShare.find(query).count();
		const battleData = await dbModel.battleShare.find(query).skip(skips).limit(+data.size).sort({_id:-1}).lean();

		res.json({status: true, data: battleData, count});

	} catch(error) {
		res.json({status: false});
		console.log('battleRecord', error);
	}
});

module.exports = router;