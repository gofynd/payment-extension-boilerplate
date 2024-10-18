const crypto = require('crypto');
const CryptoJS = require('crypto-js');
const { encode, decode } = require('base-64');

class EncryptHelper {
    static encrypt(secretKey, msg) {
        const iv = crypto.randomBytes(16); // Generate a random initialization vector
        const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(secretKey), iv);
        let encrypted = cipher.update(msg);
        encrypted = Buffer.concat([encrypted, cipher.final()]);
        return iv.toString('hex') + ':' + encrypted.toString('hex');
    }

    static decrypt(secretKey, encryptedMessage) {
        const textParts = encryptedMessage.split(':');
        const iv = Buffer.from(textParts.shift(), 'hex');
        const encryptedText = Buffer.from(textParts.join(':'), 'hex');
        const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(secretKey), iv);
        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        return decrypted.toString();
    }
}



module.exports = EncryptHelper