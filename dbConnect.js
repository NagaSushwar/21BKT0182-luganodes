const mongoose = require("mongoose");
require("dotenv").config(); // To load variables from .env file

// Connect to MongoDB using the URI from .env
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

const depositSchema = new mongoose.Schema({
  blockNumber: Number,
  blockTimestamp: Number,
  fee: Number,
  hash: String,
  pubkey: String,
});

const Deposit = mongoose.model("Deposit", depositSchema);

async function saveDeposit(deposit) {
  const newDeposit = new Deposit({
    blockNumber: deposit.blockNumber,
    blockTimestamp: deposit.blockTimestamp,
    hash: deposit.hash,
    gasUsed: parseInt(deposit.gasUsed), // converting string to integer
  });
  await newDeposit.save();
  console.log("Deposit saved to DB");
}

module.exports = { Deposit, saveDeposit };
