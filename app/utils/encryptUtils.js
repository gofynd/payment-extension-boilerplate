const crypto = require('crypto');
const CryptoJS = require('crypto-js');
const { encode, decode } = require('base-64');
const config = require('../config');

const enc_iv = config.extension.encrypt_iv;

function pad(message, blockSize) {
    const paddingLength = blockSize - (message.length % blockSize);
    const paddingChar = String.fromCharCode(paddingLength);
    return message + paddingChar.repeat(paddingLength);
}

function unpad(paddedMessage) {
    const paddingChar = paddedMessage[paddedMessage.length - 1];
    const paddingLength = paddingChar.charCodeAt(0);
    
    if (paddingLength >= paddedMessage.length) {
      // Invalid padding length
      return paddedMessage;
    }
    return paddedMessage.slice(0, paddedMessage.length - paddingLength);
}

class EncryptHelper {
    static encrypt(secretKey, msg) {
        const key = Buffer.from(decode(secretKey, 'utf-8'), 'hex');
        const msgBuffer = Buffer.from(msg, 'utf-8');
        const iv = Buffer.from(decode(enc_iv), 'hex');
        const cipher = crypto.createCipheriv('AES-256-GCM', key, iv);
        const ctBytes = Buffer.concat([cipher.update(pad(msgBuffer, 16)), cipher.final()]);
        const ct = encode(ctBytes.toString('hex'));
        return {
            enc_iv: enc_iv,
            gateway_secret: ct,
            authTag: cipher.getAuthTag().toString("hex")
        };
    }

    static decrypt(secretKey, data) {
        // TODO: fix encryption and decrypt script
        let {enc_iv, gateway_secret, authTag} = data;
        const key = Buffer.from(decode(secretKey, 'utf-8'), 'hex');
        const iv = Buffer.from(decode(enc_iv), 'hex');
        const ct = Buffer.from(decode(gateway_secret), 'hex');

        const decipher = crypto.createDecipheriv('AES-256-GCM', key, iv);
        decipher.setAuthTag(Buffer.from(authTag, 'hex'))
        const decryptedBytes = Buffer.concat([decipher.update(ct), decipher.final()]);
        const decDataString = unpad(decryptedBytes.toString('utf-8'));
        const decDataObject = JSON.parse(decDataString);
        return decDataObject;
    }

    static encryptAES(msg, secretKey, enc_iv=enc_iv) {
        const cipherText = CryptoJS.AES.encrypt(msg, secretKey, { iv: enc_iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 });
        return {
            iv: enc_iv,
            gateway_secret: cipherText.toString()
        };
    }
    
    static decryptAES(encryptedData, secretKey, enc_iv=enc_iv) {
        encryptedString = encryptedData.gateway_secret
        const decrypted = CryptoJS.AES.decrypt(encryptedData, secretKey, { iv: enc_iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 });
        return decrypted.toString(CryptoJS.enc.Utf8);
    }
}

module.exports = EncryptHelper