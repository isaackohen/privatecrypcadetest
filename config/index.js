const _ = require("lodash");

const config = {
  dbconnection:
    "mongodb://IdnSgwnJSANSkqw:YFsbKAnshSBAshsYWbs@172.31.90.241:29741/CrYpTCAdeNSjdmsYs",

  Host: "https://crypcade.io/",
  port: 12835,
  adminhost: "https://crypadsqcryp.crypcade.io/#/XE81pxg4TIbwCtg4ErB1/",

  redisData: {
    port: 29371,
    host: "172.31.92.239",
    password: "TdnSMkasnKSnsNSH",
  },

  AWS_OPTIONS: {
    accessKeyId: "AKIA2SJQLZSXUC6S7DXB",
    secretAccessKey: "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",
    region: "us-east-1",
  },

  crypto: {
    passPhrase: "T1Bt0Lx5jA9ML6AJ8523IAv0anRd03Ya",
    algorithm: "aes-256-ctr",
    jwtToken: "CRYParCAde",
    iv: "bLMjTTXPjUpWe345",
  },

  withdrawFrequencySeconds: 900,
  betFrequencySeconds: 2,
  bongoRequestExpireSeconds: 60 * 30,

  // captchaSecretKey: '6Le_NboZAAAAAMUSxxCyqnw6qns0zTquPahFAivp',
  captchaSecretKey: "6Lc_l9IZAAAAACQQXM62uKA1JeHHUkRUmRhGV-wa",

  eth: {
    provider: "https://infura.io/v3/03ce59ccc9c04565b9c2acca220125fd",
    contract: "0xCC1c71D3f6F8e44cc2EED70C850382089625aCBe",
    owner: "0x89358479982DB2e9BdA7a9CbdE64B973c456C065",
    coldwallet: "0x6bEf9865Dd006F2323e4CfFF002dC81000d39C2e",
    privateKey:
      "87c6e10e9256c5589ab65c0ba3b17ac5128f1e2d3db335971d5ae9521117fe5dc18ab7ae02714efeb8f03f19bc4dbc98ee2e7e85f0b88e1f7c645ea02634035c",
    apiUrl: "https://api.etherscan.io/",
    tranUrl: "https://etherscan.io/tx/",
  },

  matic: {
    provider: "https://rpc-mainnet.matic.network",
    contract: "0x62339279053b7c21ed6578ab6c1ebdba08237214",
    owner: "0xA9e8709E2aa6825BcFDF2D62562322De8a4710f7",
    coldwallet: "0x6bEf9865Dd006F2323e4CfFF002dC81000d39C2e",
    privateKey:
      "d6c7e85993549e509fe75f5aa8e4299741d54d7f39b667961a05e50e4217fc5a94dfe5ac5a7741febaa43f4ceb4fba9aec2e2982f7bc8b14756e0aa32565005e",
    token: "0x0000000000000000000000000000000000001010",
    matic_env: "main",
    matic_host: "Matic Network",
    matic_rpc: "https://rpc-mainnet.matic.network",
    apiUrl: "https://backup-explorer.matic.network/",
    tranUrl: "https://backup-explorer.matic.network/tx/",
  },

  trx: {
    tronEnv: "https://api.trongrid.io",
    tronEvent: "https://api.trongrid.io",
    tronKey:
      "84c4e75cc507c45195b3560ba3b67a92478d4c7f3eed67981905b0061544ac0a908ce5fe0e751af8b2f66b1cbf4ded9ae6727f87fbbf8f16716e55f370320d5d",
    tronmintKey:
      "8790e10b9d05c4519fe20a5aa2e1299146de1b2c6be234cf4a05b2074541af5491dfe0fb0d794faabaf53646bf49e99be6712e83a6ecdf12266a54a42c3e530e",
    contract: "TME6Y4LxuRHoCXJR9GdYKGefyyruQYJDqB",
    beancontract: "TRciFS9gafy8JhfKNKYVCmhdZRDMzHrveR",
    beantronkey:
      "d1c3b6099354990398e25e0cf0e77ec145d91f2e6eb639961e57e8541346a95992d9e1fc087141f8eff1374fec1dbfcdbc2e2cd5a7efdb1e753e5af42c330c59",
    apiUrl: "https://api.trongrid.io/",
    tranUrl: "https://tronscan.org/#/transaction/",
  },

  bgGames: {
    isTest: false,
  },

  slotgat: {
    merchanturl: "https://gis.slotegrator.com/api/index.php/v1",
    merchantid: "fcd87394cb298385c7804059e5d7ea09",
    merchantkey: "33e1ff88b6a179db71eefd67ad3a32fbc26abb45",
    typeid: "5e3947a1b86b9a20b37855e3",
  },
};

const allowedEnvs = ["devel", "staging"];

if (process.env.NODE_ENV && allowedEnvs.includes(process.env.NODE_ENV)) {
  const overridingConfig = require(`./${process.env.NODE_ENV}`); // eslint-disable-line global-require, import/no-dynamic-require
  _.merge(config, overridingConfig);
}

module.exports = config;
