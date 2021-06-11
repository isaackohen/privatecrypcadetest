const TronWeb = require("tronweb");

const config = require("../config");
const { decrypt } = require("../helpers/common");

module.exports = class TrxService {
  constructor() {
    this.tronLink = new TronWeb({
      fullNode: config.trx.tronEnv,
      solidityNode: config.trx.tronEnv,
      eventServer: config.trx.tronEvent,
      privateKey: decrypt(config.trx.tronKey),
    });
  }

  async init() {
    this.contract = await this.tronLink.contract().at(config.trx.contract);
  }

  async getBalance() {
    return this.contract.poolAmount().call();
  }

  async getWithdrawLimit() {
    return this.contract.withdrawLimit().call();
  }

  async withdraw(amount, address) {
    const response = {};
    await this.contract
      .withdraw(`${amount}`, address, false)
      .send(async function (err, res) {
        if (res) {
          response.txnid = res;
        } else {
          response.txnid = "";
        }
      });
    return response;
  }

  async updateWithdrawStatus(status) {
    return this.contract.methods.updateWithdrawStatus(status).send();
  }

  async updateWithdrawLimit(limit) {
    return this.contract.methods.updateWithdrawLimit(`${limit}`).send();
  }

  async updateContractStatus(status) {
    return this.contract.methods.updateContractStatus(status).send();
  }

  async getEventResult(eventName) {
    // eventName -> 'Deposit' | ''
    return this.tronLink.getEventResult(config.trx.contract, { eventName });
  }

  fromHex(address) {
    return this.tronLink.address.fromHex(address);
  }
};
