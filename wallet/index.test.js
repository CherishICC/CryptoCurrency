const Wallet = require("./index");
const Transaction = require("./transaction");
const { verifySignature } = require("../util");

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
  });
});
