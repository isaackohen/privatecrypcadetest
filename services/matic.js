const Web3 = require("web3");

const config = require("../config");
const { decrypt } = require("../helpers/common");
const { ethABI } = require("../constants/eth-abi");

module.exports = class MaticService {
  constructor() {
    this.callObj = {
      from: config.matic.owner,
      gas: 600000,
    };

    const web3 = new Web3(config.matic.provider);
    web3.eth.defaultAccount = config.matic.owner;
    web3.eth.accounts.wallet.add(decrypt(config.matic.privateKey));
    this.contract = new web3.eth.Contract(ethABI, config.matic.contract, {
      from: config.matic.owner,
      gasPrice: "20000000000",
    });
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
      .send(this.callObj);
  }

  async updateWithdrawLimit(limit) {
    return this.contract.methods
      .updateWithdrawLimit(`${limit}`)
      .send(this.callObj);
  }

  async updateContractStatus(status) {
    return this.contract.methods
      .updateContractStatus(status)
      .send(this.callObj);
  }
};
