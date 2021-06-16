// Test file for the Wallet class (index.js)

const Wallet = require("./index");
const Transaction = require("./transaction");
const Blockchain = require("../blockchain");
const { verifySignature } = require("../util");
const { STARTING_BALANCE } = require("../config");

describe("Wallet()", () => {
  let wallet;

  beforeEach(() => {
    wallet = new Wallet();
  });

  it("has a balance", () => {
    expect(wallet).toHaveProperty("balance");
  });

  it("has a publicKey", () => {
    expect(wallet).toHaveProperty("publicKey");
  });

  describe("signing data", () => {
    const data = "foo-bar";

    it("verifies signature", () => {
      expect(
        verifySignature({
          publicKey: wallet.publicKey,
          data,
          signature: wallet.sign(data),
        })
      ).toBe(true);
    });

    it("doesnot verify invalid signature", () => {
      expect(
        verifySignature({
          publicKey: wallet.publicKey,
          data,
          signature: new Wallet().sign(data),
        })
      ).toBe(false);
    });
  });

  describe("createTransaction()", () => {
    describe("amount exceeds balance", () => {
      it("throws an error", () => {
        expect(() =>
          wallet.createTransaction({ amount: 9191919, recipient: "me" })
        ).toThrow("Amount exceeds balance");
      });
    });

    describe("amount is valid", () => {
      let transaction, amount, recipient;
      beforeEach(() => {
        (amount = 50),
          (recipient = "me-again"),
          (transaction = wallet.createTransaction({ amount, recipient }));
      });

      it("creates an instance of transaction", () => {
        expect(transaction instanceof Transaction).toBe(true);
      });

      it("matches the transaction input with the wallet", () => {
        expect(transaction.input.address).toEqual(wallet.publicKey);
      });

      it("outputs the amount to the recipient", () => {
        expect(transaction.outputMap[recipient]).toEqual(amount);
      });
    });

    describe("and a chain is passed", () => {
      it("calls the calculateBalance method", () => {
        const calculateBalanceMock = jest.fn();
        const originalcalculatebalance = Wallet.calculateBalance;
        Wallet.calculateBalance = calculateBalanceMock;
        wallet.createTransaction({
          recipient: "foo",
          amount: 50,
          chain: new Blockchain().chain,
        });
        expect(calculateBalanceMock).toHaveBeenCalled();
        Wallet.calculateBalance = originalcalculatebalance;
      });
    });
  });

  describe("calculateBalance()", () => {
    let blockchain;
    beforeEach(() => {
      blockchain = new Blockchain();
    });

    describe("and there are no outputs for the wallet", () => {
      it("returns the STARTING_BALANCE", () => {
        expect(
          Wallet.calculateBalance({
            chain: blockchain.chain,
            address: wallet.publicKey,
          })
        ).toEqual(STARTING_BALANCE);
      });
    });

    describe("and there are outputs for the wallet", () => {
      let transaction1, transaction2;
      beforeEach(() => {
        transaction1 = new Wallet().createTransaction({
          recipient: wallet.publicKey,
          amount: 50,
        });
        transaction2 = new Wallet().createTransaction({
          recipient: wallet.publicKey,
          amount: 40,
        });
        blockchain.addBlock({ data: [transaction1, transaction2] });
      });

      it("adds the all the outputs to the wallet balance", () => {
        expect(
          Wallet.calculateBalance({
            chain: blockchain.chain,
            address: wallet.publicKey,
          })
        ).toEqual(
          STARTING_BALANCE +
            transaction1.outputMap[wallet.publicKey] +
            transaction2.outputMap[wallet.publicKey]
        );
      });

      describe("and the wallet has made a transaction", () => {
        let recentTransaction;
        beforeEach(() => {
          recentTransaction = wallet.createTransaction({
            recipient: "me-again",
            amount: 40,
          });

          blockchain.addBlock({ data: [recentTransaction] });
        });
        it("returns the output amount of the recent transaction", () => {
          expect(
            Wallet.calculateBalance({
              chain: blockchain.chain,
              address: wallet.publicKey,
            })
          ).toEqual(recentTransaction.outputMap[wallet.publicKey]);
        });

        describe("and there are outputs next to after the recent transaction", () => {
          let sameBlockTransaction, nextBlockTransaction;
          beforeEach(() => {
            recentTransaction = wallet.createTransaction({
              recipient: "me-again-again",
              amount: 50,
            });
            sameBlockTransaction = Transaction.rewardTransaction({
              minerWallet: wallet,
            });
            blockchain.addBlock({
              data: [recentTransaction, sameBlockTransaction],
            });
            nextBlockTransaction = new Wallet().createTransaction({
              recipient: wallet.publicKey,
              amount: 75,
            });
            blockchain.addBlock({ data: [nextBlockTransaction] });
          });
          it("includes the output amounts in the wallet balance", () => {
            expect(
              Wallet.calculateBalance({
                chain: blockchain.chain,
                address: wallet.publicKey,
              })
            ).toEqual(
              recentTransaction.outputMap[wallet.publicKey] +
                nextBlockTransaction.outputMap[wallet.publicKey] +
                sameBlockTransaction.outputMap[wallet.publicKey]
            );
          });
        });
      });
    });
  });
});
