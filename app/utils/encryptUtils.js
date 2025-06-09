const CryptoJS = require('crypto-js');
const config = require('../config');

class EncryptHelper {
    static encrypt(secretKey, msg) {
        // Simple AES encryption using crypto-js
        const cipherText = CryptoJS.AES.encrypt(msg, secretKey).toString();
        return {
            gateway_secret: cipherText
        };
    }

    static decrypt(secretKey, data) {
        const { gateway_secret } = data;
        const bytes = CryptoJS.AES.decrypt(gateway_secret, secretKey);
        return bytes.toString(CryptoJS.enc.Utf8);
    }
}

module.exports = EncryptHelper