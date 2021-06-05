const Transaction = require('../wallet/transaction');

class TransactionMiner{
    constructor({ blockchain, transactionpool, wallet, pubsub }){
        this.blockchain = blockchain,
        this.transactionpool = transactionpool,
        this.wallet = wallet,
        this.pubsub = pubsub
    }

    mineTransactions(){
        const validTransactions = this.transactionpool.validTransactions();
        validTransactions.push(Transaction.rewardTransaction({minerWallet:this.wallet}));
        this.blockchain.addBlock({data : validTransactions});
        this.pubsub.broadcastChain();
        this.transactionpool.clear();
    }
}

module.exports = TransactionMiner;