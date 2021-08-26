const Web3 = require("web3");

module.exports = async (
  privateKeyy = "78f2434a95d80bb2fba4a8ea5ab6ec636c9a649f8a6b5c329112a4e1cf6493a6",
  nonce
) => {
  try {
    web3Eth = new Web3(
      "https://mainnet.infura.io/v3/3ce480be5d4c470a95bc95e5d7f8a56a"
    ); // THIS WOULD BE NORMALLY IN AN ENV FILE!!!

    const privateKey = privateKeyy;
    const message = `Please verify your ownership with the nonce: ${nonce}`;

    // object with signature and message
    const signature = await web3Eth.eth.accounts.sign(message, privateKey);

    return signature;
  } catch (error) {
    return { error: "Something went wrong" };
  }
};
