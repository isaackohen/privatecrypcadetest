// devel config
const stagingConfig = require('./staging');

const config = {
	...stagingConfig,
	//dbconnection:'mongodb://localhost:27017/liveCRYPCADE',
   // dbconnection:'mongodb://54.173.215.76:25149/stagcryCadksnejensd',
	dbconnection:'mongodb://localhost:27017/crypcadedb',
	// mongodb://admin:password@localhost:27017/db


	Host : 'https://crypstagcade.crypcade.io/',
	port:8880,
	adminhost : 'http://localhost:4600/#/0ec82d0ac9619f3c2a3ff2/',

	redisData: {
		...stagingConfig.redisData,
		host: '34.200.27.88',
		port: 29371,
		password: 'TdnSMkasnKSnsNSH',
	},

	bgGames: {
		isTest: true,
	},
};

module.exports = config;

// do not delete
// matic mainnet - 0x62339279053b7c21ed6578ab6c1ebdba08237214
// matic mumbai - 0x4A2028e91a892F2E4DBc60Ef28e7b457Fb4Fa193
// eth ropsten - 0xCC1c71D3f6F8e44cc2EED70C850382089625aCBe
