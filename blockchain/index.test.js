const Blockchain = require('./index');
const Block = require('./block');
const { cryptoHash } = require('../util');
const { isValidChain } = require('./index');

describe('blockchain()', () => {
    let blockchain,newChain,originalChain;

    beforeEach(() => {
        blockchain = new Blockchain();
        newChain = new Blockchain();

        originalChain = blockchain.chain;
    })

    it('has a chain array instance', () => {
        expect(blockchain.chain instanceof Array).toBe(true);
    });

    it('begins with the genesis block', () => {
        expect(blockchain.chain[0]).toEqual(Block.genesis());
    });

    it('add new block to the chain', () => {
        const newData = 'foo';
        blockchain.addBlock({data: newData});
        expect(blockchain.chain[blockchain.chain.length - 1].data).toEqual(newData);
    });

    describe('isValidChain()', () => {
        describe('the first block is not the genesis block', () => {
            it('returns false', () => {
                blockchain.chain[0] = {data : 'fake-data'};
                expect(Blockchain.isValidChain(blockchain.chain)).toBe(false);
            });
        });

        describe('the chain starts with the genesis block and has multiple blocks', () => {

            beforeEach(() => {
                blockchain.addBlock({data:'hello'});
                blockchain.addBlock({data:'hello again'});
                blockchain.addBlock({data:'hello again again'});
            });
            describe('and a lastHash value has changed', () => {
                it('returns false', () => {
                    blockchain.chain[2].lastHash = 'fake-lastHash';
                    expect(Blockchain.isValidChain(blockchain.chain)).toBe(false);
                });
            });

            describe('and has a block with invalid fields', () => {
                it('returns false', () => {
                    blockchain.chain[2].data = 'fake-data';
                    expect(Blockchain.isValidChain(blockchain.chain)).toBe(false);                    
                });
            });

            describe('and difficulty is jumped', () => {
                it('should ', () => {                    
                    const lastBlock = blockchain.chain[blockchain.chain.length - 1];
                    const lastHash = lastBlock.hash;
                    const timestamp = Date.now();
                    const data = [];
                    const nonce = 0;
                    const difficulty = lastBlock.difficulty + 3;
                    const hash = cryptoHash(timestamp, data, nonce, difficulty, lastHash);
                    const badBlock = new Block({timestamp, nonce, data, lastHash, hash, difficulty});
                    blockchain.chain.push(badBlock);
                    expect(Blockchain.isValidChain(blockchain.chain)).toBe(false);
                });
            });

            describe('and all the fields are valid', () => {
                it('returns true', () => {
                    expect(Blockchain.isValidChain(blockchain.chain)).toBe(true);                                        
                });
            });
        });
    });

    describe('replaceChain()', () => {
        let logMock, errorMock;

        beforeEach(() => {
            errorMock = jest.fn();
            logMock = jest.fn();

            global.console.log = logMock;
            global.console.error = errorMock;
        });

        describe('when the new chain is not longer', () => {
            beforeEach(() => {
                newChain.chain[0] = {new : 'chain'};
                blockchain.replaceChain(newChain.chain);
            });

            it('doesnot replace the chain', () => {
                expect(blockchain.chain).toEqual(originalChain);                
            });

            it('logs an error', () => {
                expect(errorMock).toHaveBeenCalled();
            });
        });

        describe('when the new chain is longer', () => {
            beforeEach(() => {
                newChain.addBlock({data:'hello'});
                newChain.addBlock({data:'hello again'});
                newChain.addBlock({data:'hello again again'});
            });

            describe('and the chain is invalid', () => {
                beforeEach(() => {
                    newChain.chain[2].hash = 'fake-hash';
                    blockchain.replaceChain(newChain.chain);
                });

                it('doesnot replace the chain', () => {
                    expect(blockchain.chain).toEqual(originalChain);                
                });

                it('logs an error', () => {
                    expect(errorMock).toHaveBeenCalled();
                });
            });

            describe('the new chain is valid', () => {
                beforeEach(() => {
                    blockchain.replaceChain(newChain.chain);                    
                });

                it('replaces the chain', () => {
                    expect(blockchain.chain).toEqual(newChain.chain);
                });

                it('logs about chain replacement', () => {
                    expect(logMock).toHaveBeenCalled();
                });
            });
        });
    });
});