const Transaction = require("./transaction");

// Transaction pool class - stores all the transactions that are waiting to be mined
class TransacionPool {
  constructor() {
    this.transactionMap = {};
  }

  // Adding transaction into the pool
  setTransaction(transaction) {
    this.transactionMap[transaction.id] = transaction;
  }

  // Checking for an existing transaction with the same input and output addresses in the pool so as to avoid transaction duplication
  existingTransaction({ inputAddress }) {
    return Object.values(this.transactionMap).find(
      (transaction) => transaction.input.address === inputAddress
    );
  }

  setMap(transactionMap) {
    this.transactionMap = transactionMap;
  }

  // Validating all the transactions in the pool
  validTransactions() {
    return Object.values(this.transactionMap).filter((transaction) =>
      Transaction.validTransaction(transaction)
    );
  }

  clear() {
    this.transactionMap = {};
  }

  clearBlockChainTransactions({ chain }) {
    for (let i = 1; i < chain.length; i++) {
      const block = chain[i];
      for (let transaction of block.data) {
        if (this.transactionMap[transaction.id]) {
          delete this.transactionMap[transaction.id];
        }
      }
    }
  }
}

module.exports = TransacionPool;
