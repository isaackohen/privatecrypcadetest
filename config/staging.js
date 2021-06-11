// devel config
const config = {
  //dbconnection:'mongodb://localhost:27017/liveCRYPCADE',
  dbconnection:'mongodb://UsnKMSnsdmsnYAhn:12NKAsn23jednSjnsMNSi4@172.31.89.98:25149/stagcryCadksnejensd',
  //dbconnection: "mongodb://localhost:27017/crypcadedb",
  // mongodb://admin:password@localhost:27017/db
  //dbconnection:'mongodb://54.173.215.76:25149/stagcryCadksnejensd',

  Host: "https://crypstagcade.crypcade.io/",
  port: 8880,
  //port:25149,
  adminhost: "http://localhost:4600/#/0ec82d0ac9619f3c2a3ff2/",

  redisData: {
    host: "172.31.92.239",
    port: 29371,
    password: "TdnSMkasnKSnsNSH",
  },

  // for refactoring
  eth: {
    // provider: 'wss://mainnet.infura.io/ws/v3/c10670bb419e407880d6054e3bdd24d5',
    // provider: 'https://api-ropsten.etherscan.io/',
    provider: "https://ropsten.infura.io/v3/03ce59ccc9c04565b9c2acca220125fd",
    contract: "0xCC1c71D3f6F8e44cc2EED70C850382089625aCBe",
    owner: "0x89358479982DB2e9BdA7a9CbdE64B973c456C065",
    coldwallet: "0x6bEf9865Dd006F2323e4CfFF002dC81000d39C2e",
    privateKey:
      "d289b55a9554cb0095b8580ea2e22a9515dd4a7a3ce131c81a5ae20f1b43ad5cc18de2fe0f2741abbda53c4fb81fbccaeb712c88a1ba8b11736554ae26310758ff79",
    apiUrl: "https://api-ropsten.etherscan.io/",
    tranUrl: "https://ropsten.etherscan.io/tx/",
  },

  matic: {
    provider: "https://rpc-mumbai.matic.today",
    contract: "0x4A2028e91a892F2E4DBc60Ef28e7b457Fb4Fa193",
    owner: "0x89358479982DB2e9BdA7a9CbdE64B973c456C065",
    coldwallet: "0x6bEf9865Dd006F2323e4CfFF002dC81000d39C2e",
    privateKey:
      "d289b55a9554cb0095b8580ea2e22a9515dd4a7a3ce131c81a5ae20f1b43ad5cc18de2fe0f2741abbda53c4fb81fbccaeb712c88a1ba8b11736554ae26310758ff79",
    token: "0x0000000000000000000000000000000000001010",
    matic_env: "private",
    matic_host: "Mumbai Matic",
    matic_rpc: "https://rpc-mumbai.matic.today",
    apiUrl: "https://backup-mumbai-explorer.matic.today/",
    tranUrl: "https://backup-mumbai-explorer.matic.today/tx/",
  },

  trx: {
    tronEnv: "https://api.shasta.trongrid.io",
    tronEvent: "https://api.shasta.trongrid.io",
    tronKey:
      "80c9e00ec20fc804cfb95a5aa0e428c316d84a213fe033961b51e1541616fa5f9588b3f103201ca9bba23e19eb4dbbc6ba762ad5f1eadf1221695aae77300c5b",
    tronmintKey:
      "d497e455c103ce5798e0580ba4e67ac111d54b2d6bb730991a06b5001b44fd0f948fb7f00e714da3b8f96c1eb11db8cee92025d0a6badd1f71385bae2062015b",
    contract: "TXk729JJ9WSDM7a4rBoaTTTvZpzsQm6gyi",
    beancontract: "TJLJEVrDYwXMwbGzkCndtmkx8ThgJRsSv7",
    beantronkey:
      "84c3e35ec20e9e00c8b05e0ca1e77cc243d51c293fe737cb4a06e7061216ad58c685b6f10b7719abe9f23e1ab84ab1c7bc262c89f3bbdd1f7c685ea37760040b",
    apiUrl: "https://api.shasta.trongrid.io/",
    tranUrl: "https://shasta.tronscan.org/#/transaction/",
  },

  bgGames: {
    isTest: true,
  },

  slotgat: {
    merchanturl: "https://staging.slotegrator.com/api/index.php/v1",
    merchantid: "ce7ea5de66f484e0b5b3198dc2b256fb",
    merchantkey: "330e3755ae0056c23d9524f45a4c0970a2acc201",
    typeid: "5e3947a1b86b9a20b37855e3",
  },

  endorphina:{
    salt:"95AF783D831E424C88A0E889B4856D13"
  },

 };

module.exports = config;

// do not delete
// matic mainnet - 0x62339279053b7c21ed6578ab6c1ebdba08237214
// matic mumbai - 0x4A2028e91a892F2E4DBc60Ef28e7b457Fb4Fa193
// eth ropsten - 0xCC1c71D3f6F8e44cc2EED70C850382089625aCBe
