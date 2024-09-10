const { ethers } = require("ethers");
const { saveDeposit } = require("./dbConnect");
const axios = require("axios");
require("dotenv").config();

const infuraUrl = process.env.INFURA_URL;
if (!infuraUrl) {
  throw new Error("INFURA_URL is not set in .env file");
}

const provider = new ethers.providers.WebSocketProvider(infuraUrl);

const BEACON_DEPOSIT_CONTRACT = process.env.BEACON_DEPOSIT_CONTRACT;
const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN; // Store in .env
const chatId = process.env.TELEGRAM_CHAT_ID; // Store in .env

const telegramApiUrl = `https://api.telegram.org/bot${telegramBotToken}/sendMessage`;

// Function to send Telegram notifications
async function sendTelegramNotification(message) {
  try {
    await axios.post(telegramApiUrl, {
      chat_id: chatId,
      text: message,
    });
    console.log("Telegram notification sent");
  } catch (error) {
    console.error("Error sending Telegram notification:", error);
  }
}

// Function to get transaction details
async function getTransactionDetails(txHash) {
  try {
    const tx = await provider.getTransaction(txHash);
    const receipt = await provider.getTransactionReceipt(txHash);
    const block = await provider.getBlock(tx.blockNumber);

    return {
      blockNumber: tx.blockNumber,
      blockTimestamp: block.timestamp,
      hash: tx.hash,
      from: tx.from,
      value: ethers.utils.formatEther(tx.value),
      gasUsed: receipt.gasUsed.toString(),
      status: receipt.status,
    };
  } catch (error) {
    console.error(`Error fetching transaction details: ${error}`);
  }
}

// Function to track deposits
async function trackDeposits() {
  provider.on("block", async (blockNumber) => {
    console.log(`Received new block: ${blockNumber}`);
    const block = await provider.getBlockWithTransactions(blockNumber);
    for (const tx of block.transactions) {
      if (
        tx.to &&
        tx.to.toLowerCase() === BEACON_DEPOSIT_CONTRACT.toLowerCase()
      ) {
        console.log("Deposit transaction found");
        const details = await getTransactionDetails(tx.hash);
        console.log(`Deposit details: ${JSON.stringify(details)}`);

        // Save deposit to the database
        await saveDeposit(details);

        // Send a Telegram notification
        const message = `New deposit found:\nFrom: ${details.from}\nValue: ${details.value} ETH\nBlock: ${details.blockNumber}`;
        await sendTelegramNotification(message);
      }
    }
  });

  provider.on("error", (error) => {
    console.error(`Provider error: ${error}`);
  });
}

trackDeposits();
