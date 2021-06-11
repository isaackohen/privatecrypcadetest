const express = require('express')
const router = express.Router();
const { dbModel } = require('../model/db');
const common = require('../helpers/common');

//Admin
router.get('/get_total', common.whitelistMiddleware, async (req, res) => {
	try {
		const totalData = await dbModel.admintran.aggregate([ { $match: {status:1} },{$group:{_id:null,amount:{$sum:"$amount"}}}]);
		res.json({ status: true, data: totalData[0].amount });
	} catch(error) {
		res.json({ status : false });
		console.log('get_total', error);
	}
});

//Admin
router.get('/get_admintrans', common.whitelistMiddleware, async (req, res) => {
	try {
		const admintranData = await dbModel.admintran.find().sort({createddate:-1});
		if (admintranData) {
			res.json({ status: true, data:admintranData });
		} else {
			res.json({ status: false, message: 'No data found' });
		}
	} catch(error) {
		res.json({ status : false });
		console.log('get_admintrans get ', error);
	}
});

router.post('/get_admintrans', common.whitelistMiddleware, async (req, res) => {
    const data = req.body;
    if (!+data.pageNo || !+data.size) {
      res.json({ status: false, message: 'Error fetching data' });
      return;
    }

    const skips = +data.size * (+data.pageNo - 1);
    const query = data.search ? {'to_address': { $regex: '.*' + data.search + '.*', $options: 'i' }} : {};

    try {
        const totalCount = await dbModel.admintran.find(query).count();
        const adminTransactionData = await dbModel.admintran.find(query).skip(skips).limit(data.size).sort({createddate: -1});
        res.json({ status: true, data: adminTransactionData, count: totalCount });
    } catch (error) {
        res.json({ status : false });
        console.log('get_admintrans post ', error);
    }
});

router.post('/get_ethadmintrans', common.whitelistMiddleware, async (req, res) => {
    const data = req.body;
    if (!+data.pageNo || !+data.size) {
        res.json({ status: false, message: 'Error fetching data' });
        return;
    }

    const skips = +data.size * (+data.pageNo - 1);
    const query = data.search? {'to_address': { $regex: '.*' + data.search + '.*', $options: 'i' }, currency: 'ETH'} : {currency: 'ETH'};

    try {
        const totalCount = await dbModel.ethColdWallet.find(query).count();
        const adminTransactionData = await dbModel.ethColdWallet.find(query).skip(skips).limit(data.size).sort({createddate: -1});
        res.json({ status: true, data: adminTransactionData, count: totalCount });
    } catch (error) {
        res.json({ status : false });
        console.log('get_ethadmintrans', error);
    }
});

router.post('/get_maticadmintrans', common.whitelistMiddleware, async (req, res) => {
    const data = req.body;
    if (!+data.pageNo || !+data.size) {
        res.json({ status: false, message: 'Error fetching data' });
        return;
    }

    const skips = +data.size * (+data.pageNo - 1);
    const query = data.search? {to_address: { $regex: '.*' + data.search + '.*', $options: 'i' }, currency: 'MATIC'} : {currency: 'MATIC'};

    try {
        const totalCount = await dbModel.ethColdWallet.find(query).count();
        const adminTransactionData = await dbModel.ethColdWallet.find(query).skip(skips).limit(data.size).sort({createddate: -1});
        res.json({ status: true, data: adminTransactionData, count: totalCount });
    } catch (error) {
        res.json({ status : false });
        console.log('get_maticadmintrans', error);
    }
});

router.get('/get_admintrans_export', common.whitelistMiddleware, async (req, res) => {
	try {
		const adminTransactionData = await dbModel.admintran.find().sort({createddate:-1});
		if (!adminTransactionData) {
		    res.json({ status: false, message: 'No data found' });
		    return;
		}

		res.json({ status: true, data: adminTransactionData });
	} catch(error) {
		res.json({ status : false });
		console.log('get_admintrans', error)
	}
});

module.exports = router;
