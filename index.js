const express = require("express");
const bodyParser = require("body-parser");
const request = require("request");
const path = require("path");
const Blockchain = require("./blockchain");
const PubSub = require("./app/pubsub");
const TransacionPool = require("./wallet/transaction-pool");
const Wallet = require("./wallet");
const TransactionMiner = require("./app/transaction-miner");

const app = express();
const blockchain = new Blockchain();
const wallet = new Wallet();
const transactionpool = new TransacionPool();
const pubsub = new PubSub({ blockchain, transactionpool });
const transactionMiner = new TransactionMiner({
  blockchain,
  wallet,
  transactionpool,
  pubsub,
});

const DEFAULT_PORT = 3000;
const ROOT_NODE_ADDRESS = `http://localhost:${DEFAULT_PORT}`;

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname,"client/dist")))

app.get("/api/blocks", (req, res) => {
  res.json(blockchain.chain);
});

app.post("/api/mine", (req, res) => {
  const { data } = req.body;
  blockchain.addBlock({ data });
  pubsub.broadcastChain();
  res.redirect("/api/blocks");
});

app.post("/api/transact", (req, res) => {
  const { amount, recipient } = req.body;
  let transaction = transactionpool.existingTransaction({
    inputAddress: wallet.publicKey,
  });

  try {
    if (transaction) {
      transaction.update({
        senderWallet: wallet,
        amount,
        recipient,
      });
    } else {
      transaction = wallet.createTransaction({
        amount,
        recipient,
        chain: blockchain.chain,
      });
    }
  } catch (error) {
    return res.status(400).json({ type: "error", message: error.message });
  }

  transactionpool.setTransaction(transaction);
  pubsub.broadcastTransaction(transaction);
  res.json({ type: "success", transaction });
});

app.get("/api/transaction-pool-map", (req, res) => {
  res.json(transactionpool.transactionMap);
});

app.get("/api/mine-transactions", (req, res) => {
  transactionMiner.mineTransactions();
  res.redirect("/api/blocks");
});

app.get("/api/wallet-info", (req, res) => {
  res.json({
    address: wallet.publicKey,
    balance: Wallet.calculateBalance({
      chain: blockchain.chain,
      address: wallet.publicKey,
    }),
  });
  
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, 'client/dist/index.html'));
});

const syncWithRootState = () => {
  request(
    { url: `${ROOT_NODE_ADDRESS}/api/blocks` },
    (error, response, body) => {
      if (!error && response.statusCode === 200) {
        const rootChain = JSON.parse(body);
        console.log("Replacing chain on sync with", rootChain);
        blockchain.replaceChain(rootChain);
      }
    }
  );
  request(
    { url: `${ROOT_NODE_ADDRESS}/api/transaction-pool-map` },
    (error, response, body) => {
      if (!error && response.statusCode === 200) {
        const rootTransactionPoolMap = JSON.parse(body);
        console.log(
          "Replacing transaction pool map on sync with",
          rootTransactionPoolMap
        );
        transactionpool.setMap(rootTransactionPoolMap);
      }
    }
  );
};

const walletOne = new Wallet();
const walletTwo = new Wallet();

const generateWalletTransaction = ({wallet, recipient, amount}) => {
  const transaction = wallet.createTransaction({
    recipient, amount, chain: blockchain.chain
  });
  transactionpool.setTransaction(transaction);
};

const walletAction = () => generateWalletTransaction({
  wallet, recipient : walletOne.publicKey, amount : 5
});

const walletOneAction = () => generateWalletTransaction({
  wallet : walletOne, recipient : walletTwo.publicKey, amount : 10
});

const walletTwoAction = () => generateWalletTransaction({
  wallet : walletTwo, recipient : wallet.publicKey, amount : 15
});

for(let i=0;i<10;i++){
  if(i%3===0){
    walletAction();
    walletOneAction();
  } else if(i%3 === 1){
    walletAction();
    walletTwoAction();
  } else {
    walletOneAction();
    walletTwoAction();
  }

  transactionMiner.mineTransactions();
}

let PEER_PORT;
if (process.env.GENERATE_PEER_PORT === "true") {
  PEER_PORT = DEFAULT_PORT + Math.ceil(Math.random() * 1000);
}
const PORT = PEER_PORT || DEFAULT_PORT;

app.listen(PORT, () => {
  console.log(`listening at localhost:${PORT}`);
  if (PORT != DEFAULT_PORT) {
    syncWithRootState();
  }
});
