const redis = require("redis");

const CHANNELS = {
  TEST: "TEST",
  BLOCKCHAIN: "BLOCKCHAIN",
  TRANSACTION: "TRANSACTION",
};

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

  handleMessage(channel, message) {
    console.log(`Message Received. Channel: ${channel}. Message; ${message}`);
    const parsedMessage = JSON.parse(message);

    switch (channel) {
      case CHANNELS.BLOCKCHAIN:
        this.blockchain.replaceChain(parsedMessage, true, () => {
          this.transactionpool.clearBlockChainTransactions({
            chain: parsedMessage,
          });
        });
        break;
      case CHANNELS.TRANSACTION:
        this.transactionpool.setTransaction(parsedMessage);
        break;
      default:
        return;
    }
  }

  subscribeToChannels() {
    Object.values(CHANNELS).forEach((channel) => {
      this.subscriber.subscribe(channel);
    });
  }

  publish({ channel, message }) {
    this.subscriber.unsubscribe(channel, () => {
      this.publisher.publish(channel, message, () => {
        this.subscriber.subscribe(channel);
      });
    });
  }

  broadcastChain() {
    this.publish({
      channel: CHANNELS.BLOCKCHAIN,
      message: JSON.stringify(this.blockchain.chain),
    });
  }

  broadcastTransaction(transaction) {
    this.publish({
      channel: CHANNELS.TRANSACTION,
      message: JSON.stringify(transaction),
    });
  }
}

module.exports = PubSub;
