// Setting the initial difficulty
const INITIAL_DIFFICULTY = 3;

// Setting the rate of mining
const MINE_RATE = 1000;

// Setting the first block in the blockchain
const GENESIS_DATA = {
  timestamp: 1,
  lastHash: "---",
  hash: "hash-one",
  data: [],
  difficulty: INITIAL_DIFFICULTY,
  nonce: 0,
};

// Setting the starting balance of the wallet
const STARTING_BALANCE = 1000;

// Setting the input map for the reward transaction
const REWARD_INPUT = {
  address: "*authorized-address*",
};

// Setting the reward for mining a block
const MINING_REWARD = 50;

module.exports = {
  GENESIS_DATA,
  MINE_RATE,
  STARTING_BALANCE,
  REWARD_INPUT,
  MINING_REWARD,
};
