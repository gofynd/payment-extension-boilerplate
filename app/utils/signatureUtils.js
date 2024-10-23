const crypto = require("node:crypto");

function getHmacChecksum(message, secret) {
    const hmac = crypto.createHmac('sha256', secret).update(message);
    return hmac.digest('hex').toString();
}

module.exports = {
    getHmacChecksum,
}