import { ethers } from "ethers";
import fs from "fs";
import axios from "axios";

// Ethers provider for interacting with Ethereum
const ethProvider = new ethers.providers.JsonRpcProvider(
  "https://eth-mainnet.g.alchemy.com/v2/qKwF0m6PlH1aCCWMahIeMTDheQVfQnvd"
);

// Beacon Deposit Contract Address
const beaconContractAddress = "0x00000000219ab540356cBB839Cbe05303d7705Fa";

// ABI for the deposit contract
const depositContractABI = [
  {
    inputs: [],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, internalType: "bytes", name: "pubkey", type: "bytes" },
      {
        indexed: false,
        internalType: "bytes",
        name: "withdrawal_credentials",
        type: "bytes",
      },
      { indexed: false, internalType: "bytes", name: "amount", type: "bytes" },
      {
        indexed: false,
        internalType: "bytes",
        name: "signature",
        type: "bytes",
      },
      { indexed: false, internalType: "bytes", name: "index", type: "bytes" },
    ],
    name: "DepositEvent",
    type: "event",
  },
  {
    inputs: [
      { internalType: "bytes", name: "pubkey", type: "bytes" },
      { internalType: "bytes", name: "withdrawal_credentials", type: "bytes" },
      { internalType: "bytes", name: "signature", type: "bytes" },
      { internalType: "bytes32", name: "deposit_data_root", type: "bytes32" },
    ],
    name: "deposit",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [],
    name: "get_deposit_count",
    outputs: [{ internalType: "bytes", name: "", type: "bytes" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "get_deposit_root",
    outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "bytes4", name: "interfaceId", type: "bytes4" }],
    name: "supportsInterface",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "pure",
    type: "function",
  },
];

// Telegram Bot Configuration
const telegramToken = "6934705185:AAG25d6M5VS1VQDl4totrA0zc_F0Q5iv58Q";
const telegramChatId = "YOUR_TELEGRAM_CHAT_ID";
const telegramUrl = `https://api.telegram.org/bot${telegramToken}/sendMessage`;

// Creating the contract object
const beaconContract = new ethers.Contract(
  beaconContractAddress,
  depositContractABI,
  ethProvider
);

// Function to send Telegram notification
async function notifyTelegram(message) {
  try {
    await axios.post(telegramUrl, {
      chat_id: telegramChatId,
      text: message,
    });
  } catch (error) {
    console.error("Error sending Telegram notification:", error);
  }
}

// Function to log deposit event data and send notification
async function processDepositData(depositData) {
  const { pubkey, withdrawal_credentials, amount, signature, index } =
    depositData;

  const depositInfo = {
    pubkey: ethers.utils.hexlify(pubkey),
    withdrawal_credentials: ethers.utils.hexlify(withdrawal_credentials),
    amount: ethers.utils.formatBytes32String(amount),
    signature: ethers.utils.hexlify(signature),
    index: ethers.utils.formatBytes32String(index),
    timestamp: new Date().toISOString(),
  };

  console.log("New Deposit Detected:", depositInfo);

  // Append to file (for persistence)
  fs.appendFileSync(
    "deposits.json",
    JSON.stringify(depositInfo) + ",\n",
    "utf-8"
  );

  // Send Telegram notification
  const message = `New Deposit Detected:\n\nPubkey: ${depositInfo.pubkey}\nWithdrawal Credentials: ${depositInfo.withdrawal_credentials}\nAmount: ${depositInfo.amount}\nSignature: ${depositInfo.signature}\nIndex: ${depositInfo.index}\nTimestamp: ${depositInfo.timestamp}`;
  await notifyTelegram(message);
}

// Function to track deposits in real-time
function monitorDeposits() {
  beaconContract.on(
    "DepositEvent",
    (pubkey, withdrawal_credentials, amount, signature, index, event) => {
      processDepositData({
        pubkey,
        withdrawal_credentials,
        amount,
        signature,
        index,
      });
    }
  );
}

// Function to get the deposit count
async function fetchDepositCount() {
  try {
    const depositCountBytes = await beaconContract.get_deposit_count();
    const depositCount = ethers.BigNumber.from(depositCountBytes);
    console.log("Deposit Count:", depositCount.toString());
  } catch (error) {
    console.error("Error fetching deposit count:", error);
  }
}

// Function to get the deposit root
async function fetchDepositRoot() {
  try {
    const depositRoot = await beaconContract.get_deposit_root();
    console.log("Deposit Root:", depositRoot);
  } catch (error) {
    console.error("Error fetching deposit root:", error);
  }
}

// Start tracking deposits
monitorDeposits();

// Fetch deposit count and root
fetchDepositCount();
fetchDepositRoot();
