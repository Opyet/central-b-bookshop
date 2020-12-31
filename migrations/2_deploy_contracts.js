var CentralBBookshop = artifacts.require("CentralBBookshop");
const commission = 10;

module.exports = function(deployer) {
  deployer.deploy(CentralBBookshop, commission);
};
