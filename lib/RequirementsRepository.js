var Requirements = require('./Requirements');
const promisify = require("es6-promisify");
const utils = require('./web3-utils');

const DEPLOY_GAS_LIMIT = 1500000;

class RequirementsRepository {

  constructor(requirementsFactoryJSON = require('../build/contracts/RangeRequirementsFactory.json')) {
    this.RequirementsContract = web3.eth.contract(requirementsFactoryJSON.abi);
    this.data = requirementsFactoryJSON.unlinked_binary;
  }

  create(name, marketAddress, attributes, transactionHashCallback) {
    var ids = attributes.map((attribute) => attribute.id);
    var types = attributes.map((attribute) => 0);
    var decimals = attributes.map((attribute) => attribute.decimals);
    var mins = attributes.map((attribute, index) => utils.toBigNumberWithDecimals(attribute.min, decimals[index]));
    var maxs = attributes.map((attribute, index) => utils.toBigNumberWithDecimals(attribute.max, decimals[index]));

    var transactionParams = {
      from: web3.eth.accounts[0],
      gas: DEPLOY_GAS_LIMIT,
      data: this.data
    }

    return new Promise((resolve, reject) => {
      this.RequirementsContract.new(name, marketAddress, transactionParams,
        async(err, newContract) => {
          if (err) {
            reject(err);
          } else if (!newContract.address && transactionHashCallback) {
            transactionHashCallback(newContract.transactionHash);
          } else if (newContract.address) {
            newContract.setAttributes(ids, types, decimals, mins, maxs,
              { from: web3.eth.accounts[0], gas: DEPLOY_GAS_LIMIT },
              (err, result) => err ? reject(err) : resolve(new Requirements(newContract)));
          }
        });
    });
  }

  async fromAddress(requirementsAddress) {
    return new Requirements(await this.RequirementsContract.at(requirementsAddress));
  }

  async getAllFromMarket(_market) {
    let count = await _market.requirementsCount();
    let requirements = [];
    for (var i = 0; i < count; i++) {
      var requirementAddress = await promisify(_market.marketContract.requirementsAt)(i);
      requirements.push(await this.fromAddress(requirementAddress));
    }
    return requirements;
  }

  async findQualityByName(name, _market) {
    var requirementsAddress = await promisify(_market.marketContract.getRequirementsByName)(name);
    var requirementsContract = this.RequirementsContract.at(requirementsAddress);
    return new Requirements(requirementsContract);
  }
}

module.exports = RequirementsRepository;
