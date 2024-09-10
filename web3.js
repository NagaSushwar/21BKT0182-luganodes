const { Web3 } = require("web3");
require("dotenv").config();

const infuraUrl = process.env.INFURA_URL;

if (!infuraUrl) {
  throw new Error("INFURA_URL is not set in .env file");
}

const web3 = new Web3(new Web3.providers.WebsocketProvider(infuraUrl));

// Check if connection to Ethereum node is successful
web3.eth.net
  .isListening()
  .then(() => console.log("Connected to Ethereum node"))
  .catch((e) => console.error("Connection error:", e));

web3.eth
  .subscribe("newBlockHeaders")
  .on("data", (blockHeader) => {
    console.log("New block header:", blockHeader);
  })
  .on("error", (error) => {
    console.error("Subscription error:", error);
  });

module.exports = web3;
