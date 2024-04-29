const crypto = require("node:crypto");

function getHashChecksum(message, secret) {
    const hmac = crypto.createHash('sha256');
    hmac.update(message + secret);
    return hmac.digest('hex').toString();
}

function getHmacChecksum(message, secret) {
    const hmac = crypto.createHmac('sha256', secret).update(message);
    return hmac.digest('hex').toString();
}

function compareHashDigest(originalSignature, message, secret) {
    const signature = getHmacChecksum(message, secret);
    return hmac.compareDigest(signature.toUpperCase(), originalSignature.toUpperCase());
}

module.exports = {
    getHashChecksum,
    getHmacChecksum,
    compareHashDigest,
}