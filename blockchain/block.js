const { GENESIS_DATA, MINE_RATE } = require("../config");
const { cryptoHash } = require("../util");
const hexToBinary = require("hex-to-binary");

// Basic Block class

class Block {
  constructor({ timestamp, lastHash, data, hash, nonce, difficulty }) {
    this.timestamp = timestamp;
    this.lastHash = lastHash;
    this.hash = hash;
    this.data = data;
    this.nonce = nonce;
    this.difficulty = difficulty;
  }

  // Genesis Block or The first block
  static genesis() {
    return new this(GENESIS_DATA);
  }

  // Mining a new block
  static mineBlock({ lastBlock, data }) {
    let timestamp, nonce, hash;
    const lastHash = lastBlock.hash;
    let difficulty = lastBlock.difficulty;
    nonce = 0;

    do {
      timestamp = Date.now();
      nonce++;
      difficulty = Block.adjustDifficulty({
        originalBlock: lastBlock,
        timestamp,
      });
      hash = cryptoHash(timestamp, lastHash, data, nonce, difficulty);
    } while (
      hexToBinary(hash).substring(0, difficulty) !== "0".repeat(difficulty)
    );

    return new this({
      timestamp,
      lastHash,
      data,
      difficulty,
      nonce,
      hash,
    });
  }

  /* Adjusting the mining difficulty to control the rate of mining 
     by comparing the time taken to mine a block with the set MINE_RATE and adjusting the difficulty accordingly */
  static adjustDifficulty({ originalBlock, timestamp }) {
    const difficulty = originalBlock.difficulty;
    if (difficulty < 1) return 1;
    if (timestamp - originalBlock.timestamp > MINE_RATE) return difficulty - 1;

    return difficulty + 1;
  }
}

module.exports = Block;
