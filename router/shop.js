const express = require('express')
const router = express.Router();
const ShopService = require('../services/shop');
const common = require('../helpers/common');

router.get('/boxes', common.whitelistMiddleware, async function(req, res) {
	const shopService = new ShopService();

	try {
		const data = await shopService.getShopBoxes();

		res.json({ status:true, data: data });
	}
	catch(e) {
		res.json({ status : false});
		console.log('get_boxes',e)
	}
})

router.post('/boxes', common.whitelistMiddleware, async function(req, res) {
	const shopService = new ShopService();
	try {
		const data = await shopService.getShopBoxes(req.body.currency);
		res.json({ status:true, data: data });
	}
	catch(e) {
		res.json({ status : false});
		console.log('get_boxes',e)
	}
});

router.post('/buy', common.tokenMiddleware, async function(req, res) {
	const shopService = new ShopService();
	const userId = req.genuserId;
	const shopBoxId = req.body.shopBoxId;
	const currency = req.body.currency;

	try {
		const buyTimeRestriction = await shopService.getBuyTimeRestriction(userId);

		if (buyTimeRestriction.restricted) {
			res.status(429)
			res.json({
				status : false,
				error: `You need to wait for ${Math.ceil(buyTimeRestriction.remainingSeconds / 60)} minutes before buying another box`,
			});

			return;
		}

		const response = await shopService.buyShopBox(userId, shopBoxId,currency);

		res.json({ status:true, data: response });
	}
	catch(e) {
		res.status(400);
		res.json({ status : false, error: e });
		console.log('get_boxes',e)
	}
})

module.exports = router;
