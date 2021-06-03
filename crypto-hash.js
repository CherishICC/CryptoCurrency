const crypto = require('crypto');

const crptoHash = (...inputs) => {
    const hash = crypto.createHash('sha256');

    hash.update(inputs.sort().join(' '));             // hash.update takes a string, so join
    return hash.digest('hex');
};

module.exports = crptoHash;