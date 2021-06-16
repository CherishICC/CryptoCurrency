// Test file for the Blockchain class (index.js)

const Blockchain = require("./index");
const Block = require("./block");
const { cryptoHash } = require("../util");
const { isValidChain } = require("./index");
const Wallet = require("../wallet");
const Transaction = require("../wallet/transaction");

describe("blockchain()", () => {
  let blockchain, newChain, originalChain, errorMock;

  beforeEach(() => {
    errorMock = jest.fn();
    blockchain = new Blockchain();
    newChain = new Blockchain();

    originalChain = blockchain.chain;
    global.console.error = errorMock;
  });

  it("has a chain array instance", () => {
    expect(blockchain.chain instanceof Array).toBe(true);
  });

  it("begins with the genesis block", () => {
    expect(blockchain.chain[0]).toEqual(Block.genesis());
  });

  it("add new block to the chain", () => {
    const newData = "foo";
    blockchain.addBlock({ data: newData });
    expect(blockchain.chain[blockchain.chain.length - 1].data).toEqual(newData);
  });

  describe("isValidChain()", () => {
    describe("the first block is not the genesis block", () => {
      it("returns false", () => {
        blockchain.chain[0] = { data: "fake-data" };
        expect(Blockchain.isValidChain(blockchain.chain)).toBe(false);
      });
    });

    describe("the chain starts with the genesis block and has multiple blocks", () => {
      beforeEach(() => {
        blockchain.addBlock({ data: "hello" });
        blockchain.addBlock({ data: "hello again" });
        blockchain.addBlock({ data: "hello again again" });
      });
      describe("and a lastHash value has changed", () => {
        it("returns false", () => {
          blockchain.chain[2].lastHash = "fake-lastHash";
          expect(Blockchain.isValidChain(blockchain.chain)).toBe(false);
        });
      });

      describe("and has a block with invalid fields", () => {
        it("returns false", () => {
          blockchain.chain[2].data = "fake-data";
          expect(Blockchain.isValidChain(blockchain.chain)).toBe(false);
        });
      });

      describe("and difficulty is jumped", () => {
        it("should ", () => {
          const lastBlock = blockchain.chain[blockchain.chain.length - 1];
          const lastHash = lastBlock.hash;
          const timestamp = Date.now();
          const data = [];
          const nonce = 0;
          const difficulty = lastBlock.difficulty + 3;
          const hash = cryptoHash(timestamp, data, nonce, difficulty, lastHash);
          const badBlock = new Block({
            timestamp,
            nonce,
            data,
            lastHash,
            hash,
            difficulty,
          });
          blockchain.chain.push(badBlock);
          expect(Blockchain.isValidChain(blockchain.chain)).toBe(false);
        });
      });

      describe("and all the fields are valid", () => {
        it("returns true", () => {
          expect(Blockchain.isValidChain(blockchain.chain)).toBe(true);
        });
      });
    });
  });

  describe("replaceChain()", () => {
    let logMock;

    beforeEach(() => {
      logMock = jest.fn();

      global.console.log = logMock;
    });

    describe("when the new chain is not longer", () => {
      beforeEach(() => {
        newChain.chain[0] = { new: "chain" };
        blockchain.replaceChain(newChain.chain);
      });

      it("doesnot replace the chain", () => {
        expect(blockchain.chain).toEqual(originalChain);
      });

      it("logs an error", () => {
        expect(errorMock).toHaveBeenCalled();
      });
    });

    describe("when the new chain is longer", () => {
      beforeEach(() => {
        newChain.addBlock({ data: "hello" });
        newChain.addBlock({ data: "hello again" });
        newChain.addBlock({ data: "hello again again" });
      });

      describe("and the chain is invalid", () => {
        beforeEach(() => {
          newChain.chain[2].hash = "fake-hash";
          blockchain.replaceChain(newChain.chain);
        });

        it("doesnot replace the chain", () => {
          expect(blockchain.chain).toEqual(originalChain);
        });

        it("logs an error", () => {
          expect(errorMock).toHaveBeenCalled();
        });
      });

      describe("the new chain is valid", () => {
        beforeEach(() => {
          blockchain.replaceChain(newChain.chain);
        });

        it("replaces the chain", () => {
          expect(blockchain.chain).toEqual(newChain.chain);
        });

        it("logs about chain replacement", () => {
          expect(logMock).toHaveBeenCalled();
        });
      });
    });

    describe("and the validateTransactions flag is true", () => {
      it("calls the validTransactionData()", () => {
        const validMock = jest.fn();
        blockchain.validTransactionData = validMock;
        newChain.addBlock({ data: "hello" });
        blockchain.replaceChain(newChain.chain, true);
        expect(validMock).toHaveBeenCalled();
      });
    });
  });

  describe("validTransactionData()", () => {
    let transaction, rewardTransaction, wallet;

    beforeEach(() => {
      wallet = new Wallet();
      transaction = wallet.createTransaction({ recipient: "me", amount: 65 });
      rewardTransaction = Transaction.rewardTransaction({
        minerWallet: wallet,
      });
    });

    describe("and the transaction data is valid", () => {
      it("returns true", () => {
        newChain.addBlock({ data: [transaction, rewardTransaction] });
        expect(blockchain.validTransactionData({ chain: newChain.chain })).toBe(
          true
        );
        expect(errorMock).not.toHaveBeenCalled();
      });
    });

    describe("and the transaction data has multiple rewards", () => {
      it("returns false and logs an error", () => {
        newChain.addBlock({
          data: [transaction, rewardTransaction, rewardTransaction],
        });
        expect(blockchain.validTransactionData({ chain: newChain.chain })).toBe(
          false
        );
        expect(errorMock).toHaveBeenCalled();
      });
    });

    describe("and the transaction data has a malformed outputMap", () => {
      describe("and the transaction is not reward", () => {
        it("returns false and logs an error", () => {
          transaction.outputMap[wallet.publicKey] = 912440;
          newChain.addBlock({ data: [transaction, rewardTransaction] });
          expect(
            blockchain.validTransactionData({ chain: newChain.chain })
          ).toBe(false);
          expect(errorMock).toHaveBeenCalled();
        });
      });

      describe("and the transaction is reward", () => {
        it("returns false and logs an error", () => {
          rewardTransaction.outputMap[wallet.publicKey] = 914824;
          newChain.addBlock({ data: [transaction, rewardTransaction] });
          expect(
            blockchain.validTransactionData({ chain: newChain.chain })
          ).toBe(false);
          expect(errorMock).toHaveBeenCalled();
        });
      });
    });

    describe("and the transaction data has atleast one malformed input", () => {
      it("returns false and logs an error", () => {
        wallet.balance = 9000;

        evilOutputMap = {
          fooRecipient: 100,
          [wallet.publicKey]: 8900,
        };

        const evilTransaction = {
          input: {
            timestamp: Date.now(),
            amount: wallet.balance,
            address: wallet.publicKey,
            signature: wallet.sign(evilOutputMap),
          },
          outputMap: evilOutputMap,
        };
        newChain.addBlock({ data: [evilTransaction, rewardTransaction] });
        expect(blockchain.validTransactionData({ chain: newChain.chain })).toBe(
          false
        );
        expect(errorMock).toHaveBeenCalled();
      });
    });

    describe("and a block contains multiple identical transactions", () => {
      it("returns false and logs an error", () => {
        newChain.addBlock({
          data: [transaction, transaction, transaction, rewardTransaction],
        });
        expect(blockchain.validTransactionData({ chain: newChain.chain })).toBe(
          false
        );
        expect(errorMock).toHaveBeenCalled();
      });
    });
  });
});
