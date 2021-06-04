const crypto = require('crypto');

const crptoHash = (...inputs) => {
    const hash = crypto.createHash('sha256');

    hash.update(inputs.map(input => JSON.stringify(input)).sort().join(' '));             // hash.update takes a string, so join
    return hash.digest('hex');
};

module.exports = crptoHash;