const redis = require("redis");

const CHANNELS = {
  TEST: "TEST",
  BLOCKCHAIN: "BLOCKCHAIN",
  TRANSACTION: "TRANSACTION",
};

// PubSub class
class PubSub {
  constructor({ blockchain, transactionpool }) {
    this.blockchain = blockchain;
    this.transactionpool = transactionpool;
    this.publisher = redis.createClient();
    this.subscriber = redis.createClient();

    this.subscribeToChannels();

    this.subscriber.on("message", (channel, message) =>
      this.handleMessage(channel, message)
    );
  }

  // Receiving messages in the channel
  handleMessage(channel, message) {
    console.log(`Message Received. Channel: ${channel}. Message; ${message}`);
    const parsedMessage = JSON.parse(message);

    switch (channel) {
      // Calling the replaceChain function on the incoming chain
      case CHANNELS.BLOCKCHAIN:
        this.blockchain.replaceChain(parsedMessage, true, () => {
          this.transactionpool.clearBlockChainTransactions({
            chain: parsedMessage,
          });
        });
        break;
      // Updating the transaction pool
      case CHANNELS.TRANSACTION:
        this.transactionpool.setTransaction(parsedMessage);
        break;
      default:
        return;
    }
  }

  // Subscribing to the channels
  subscribeToChannels() {
    Object.values(CHANNELS).forEach((channel) => {
      this.subscriber.subscribe(channel);
    });
  }

  // Publishing a message in a channel
  publish({ channel, message }) {
    this.subscriber.unsubscribe(channel, () => {
      this.publisher.publish(channel, message, () => {
        this.subscriber.subscribe(channel);
      });
    });
  }

  // Broadcasting the new chain
  broadcastChain() {
    this.publish({
      channel: CHANNELS.BLOCKCHAIN,
      message: JSON.stringify(this.blockchain.chain),
    });
  }

  // Broadcasting the new transactions
  broadcastTransaction(transaction) {
    this.publish({
      channel: CHANNELS.TRANSACTION,
      message: JSON.stringify(transaction),
    });
  }
}

module.exports = PubSub;
