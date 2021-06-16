const crypto = require("crypto");

const cryptoHash = (...inputs) => {
  const hash = crypto.createHash("sha256");

  // hash.update takes a string, so join
  hash.update(
    inputs.map((input) => JSON.stringify(input)).sort().join(" ")
  );
  return hash.digest("hex");
};

module.exports = cryptoHash;
