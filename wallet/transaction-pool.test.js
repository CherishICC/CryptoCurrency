// Test file for the Transaction-pool class

const TransactionPool = require("./transaction-pool");
const Transaction = require("./transaction");
const Wallet = require("./index");
const Blockchain = require("../blockchain");

describe("TransacionPool()", () => {
  let transactionpool, transaction, senderWallet;
  beforeEach(() => {
    senderWallet = new Wallet();
    transactionpool = new TransactionPool();
    transaction = new Transaction({
      senderWallet,
      recipient: "me-again",
      amount: 50,
    });
  });

  describe("setTransaction()", () => {
    it("adds a transaction", () => {
      transactionpool.setTransaction(transaction);
      expect(transactionpool.transactionMap[transaction.id]).toBe(transaction);
    });
  });

  describe("existingTransaction", () => {
    it("returns an existing transaction of an input address", () => {
      transactionpool.setTransaction(transaction);
      expect(
        transactionpool.existingTransaction({
          inputAddress: senderWallet.publicKey,
        })
      ).toBe(transaction);
    });
  });

  describe("validTransactions()", () => {
    let validTransactions, errorMock;
    beforeEach(() => {
      validTransactions = [];
      errorMock = jest.fn();
      global.console.error = errorMock;
      for (let i = 0; i < 10; i++) {
        transaction = new Transaction({
          senderWallet,
          recipient: "not-me-again",
          amount: 25,
        });
        if (i % 3 === 0) {
          transaction.input.amount = 109387;
        } else if (i % 3 === 1) {
          transaction.input.signature = new Wallet().sign("hehe");
        } else {
          validTransactions.push(transaction);
        }
        transactionpool.setTransaction(transaction);
      }
    });
    it("returns valid transactions", () => {
      expect(transactionpool.validTransactions()).toEqual(validTransactions);
    });

    it("logs error for invalid transaction", () => {
      transactionpool.validTransactions();
      expect(errorMock).toHaveBeenCalled();
    });
  });

  describe("clear()", () => {
    it("clears the transactions", () => {
      transactionpool.clear();
      expect(transactionpool.transactionMap).toEqual({});
    });
  });

  describe("clearBlockChainTransactions()", () => {
    it("clears the pool of any existing blockchain transactions", () => {
      const blockchain = new Blockchain();
      const expectedTransactionMap = {};

      for (let i = 0; i < 6; i++) {
        const transaction = new Wallet().createTransaction({
          recipient: "me",
          amount: 30,
        });
        transactionpool.setTransaction(transaction);
        if (i % 2 === 0) {
          blockchain.addBlock({ data: [transaction] });
        } else {
          expectedTransactionMap[transaction.id] = transaction;
        }
      }
      transactionpool.clearBlockChainTransactions({ chain: blockchain.chain });
      expect(transactionpool.transactionMap).toEqual(expectedTransactionMap);
    });
  });
});
