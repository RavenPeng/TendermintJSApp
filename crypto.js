var crypto = require("crypto");
var path = require("path");
var fs = require("fs");
var bitcoin = require("bitcoinjs-lib");

var encryptStringWithRsaPublicKey = function(toEncrypt, relativeOrAbsolutePathToPublicKey) {
    var absolutePath = path.resolve(relativeOrAbsolutePathToPublicKey);
    var publicKey = fs.readFileSync(absolutePath, "utf8");
    var buffer = new Buffer(toEncrypt);
    var encrypted = crypto.publicEncrypt(publicKey, buffer);
    return encrypted.toString("base64");
};

var decryptStringWithRsaPrivateKey = function(toDecrypt, relativeOrAbsolutePathtoPrivateKey) {
    var absolutePath = path.resolve(relativeOrAbsolutePathtoPrivateKey);
    var privateKey = fs.readFileSync(absolutePath, "utf8");
    var buffer = new Buffer(toDecrypt, "base64");
    var decrypted = crypto.privateDecrypt(privateKey, buffer);
    return decrypted.toString("utf8");
};

var decryptStringWithRsaPublicKey = function(toDecrypt, publicKey) {
    return crypto.publicDecrypt(publicKey, buffer);
};

//debugger;
function rng () { return Buffer.from('zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz') }
var keyPair = bitcoin.ECPair.makeRandom( { rng: rng } );

//console.log( bitcoin.payments.p2pkh({ pubkey: keyPair.publicKey }) );
//const { address } = bitcoin.payments.p2pkh({ pubkey: keyPair.publicKey });
var p2phAddress  = bitcoin.payments.p2pkh({ pubkey: keyPair.publicKey });
console.log(p2phAddress.address);
console.log(keyPair.toWIF());

module.exports = {
    encryptStringWithRsaPublicKey: encryptStringWithRsaPublicKey,
    decryptStringWithRsaPrivateKey: decryptStringWithRsaPrivateKey,
    decryptStringWithRsaPublicKey: decryptStringWithRsaPublicKey
}
