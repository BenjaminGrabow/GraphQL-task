const Web3 = require("web3");
const contracts = require("../contracts/contracts.js");

module.exports = async (blockchainNetwork, publicAddress) => {
  try {
    let web3Eth, ethContract, web3Bsc, bscContract;
    const ethBlockchainEnabled = blockchainNetwork === "ethMainnet";

    if (ethBlockchainEnabled) {
      web3Eth = new Web3(
        "https://mainnet.infura.io/v3/3ce480be5d4c470a95bc95e5d7f8a56a"
      ); // THIS WOULD BE NORMALLY IN AN ENV FILE!!!

      ethContract = new web3Eth.eth.Contract(
        contracts.eth.abi,
        contracts.eth.address
      );
    } else {
      web3Bsc = new Web3("https://bsc-dataseed1.binance.org");

      bscContract = new web3Bsc.eth.Contract(
        contracts.bsc.abi,
        contracts.bsc.address
      );
    }

    const getBalance = async (contract, publicAddress) => {
      const usersBalanceInWei = await contract.methods
        .balanceOf(publicAddress)
        .call();

      const userbalanceInEth = Web3.utils.fromWei(usersBalanceInWei, "ether");
      return userbalanceInEth;
    };

    const tokenBalance = await getBalance(
      ethBlockchainEnabled ? ethContract : bscContract,
      publicAddress
    );

    return { blockchainNetwork, publicAddress, tokenBalance };
  } catch (error) {
    return { blockchainNetwork, publicAddress, error: "Something went wrong" };
  }
};
