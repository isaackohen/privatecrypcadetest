const Web3 = require("web3");

const config = require("../config");
const { decrypt } = require("../helpers/common");
const { ethABI } = require("../constants/eth-abi");

module.exports = class EthService {
  constructor() {
    this.callObj = {
      from: config.eth.owner,
      gas: 600000,
      gasPrice: "0x04e3b29200",
    };
    this.callWithValueObj = {
      ...this.callObj,
      value: "0x0",
    };
    const web3 = new Web3(config.eth.provider);
    web3.eth.defaultAccount = config.eth.owner;
    web3.eth.accounts.wallet.add(decrypt(config.eth.privateKey));
    this.contract = new web3.eth.Contract(ethABI, config.eth.contract);
  }

  async getBalance() {
    return this.contract.methods.poolAmount().call();
  }

  async getWithdrawLimit() {
    return this.contract.methods.withdrawLimit().call();
  }

  async withdraw(amount, address) {
    return this.contract.methods
      .withdraw(`${amount}`, address, false)
      .send(this.callObj);
  }

  async updateWithdrawStatus(status) {
    return this.contract.methods
      .updateWithdrawStatus(status)
      .send(this.callWithValueObj);
  }

  async updateWithdrawLimit(limit) {
    return this.contract.methods
      .updateWithdrawLimit(`${limit}`)
      .send(this.callWithValueObj);
  }

  async updateContractStatus(status) {
    return this.contract.methods
      .updateContractStatus(status)
      .send(this.callWithValueObj);
  }
};
