define([
    'neoatlantis-crypto-js',
    'curve25519'
], function(crypto, curve25519){
//////////////////////////////////////////////////////////////////////////////
function cipher(){
    var self = this;

    var PRIVATEKEY = crypto.util.encoding(
        new crypto.util.srand().bytes(32)
    ).toHEX();
    var PUBLICKEY = curve25519.hexEncode(curve25519.cipher(
        curve25519.hexDecode(PRIVATEKEY)
    ));

    var peerKeys = {};

    function importPeerPublicKey(peerPublicKeyHEX){
        if(!/^[0-9a-f]{64}$/.test(peerPublicKeyHEX)) return false;
        if(peerKeys[peerPublicKeyHEX]) return peerKeys[peerPublicKeyHEX];
        var sharedsecretHEX = curve25519.hexEncode(curve25519.cipher(
            curve25519.hexDecode(PRIVATEKEY),
            curve25519.hexDecode(peerPublicKeyHEX)
        ));
        var sharedsecret = crypto.util.encoding(
            sharedsecretHEX,
            'hex'
        ).toArrayBuffer();
        var fingerprint = new crypto.hash(6).hash(sharedsecret).hex;
        peerKeys[peerPublicKeyHEX] = {
            pk: peerPublicKeyHEX,
            ss: sharedsecret,
            fp: fingerprint,
        };
        return peerKeys[peerPublicKeyHEX];
    };

    this.getPublicKey = function(){
        return PUBLICKEY.toLowerCase();
    };

    this.peerPublicKey = function(peerPublicKeyHEX){
        var peerInfo = importPeerPublicKey(peerPublicKeyHEX);
        if(false === peerInfo) return null;
        return peerInfo.pk; // pk is only filtered from above call to import.
    };

    this.peerFingerprint = function(peerPublicKeyHEX){
        var peerInfo = importPeerPublicKey(peerPublicKeyHEX);
        if(false === peerInfo) return null;
        return peerInfo.fp;
    };

    this.encrypt = function(peerPublicKeyHEX, plaintext){
        var peerInfo = importPeerPublicKey(peerPublicKeyHEX);
        if(false === peerInfo) return null;
        var sharedsecret = peerInfo.ss;
    };

    this.decrypt = function(peerPublicKeyHEX, ciphertext){
        var peerInfo = importPeerPublicKey(peerPublicKeyHEX);
        if(false === peerInfo) return null;
        var sharedsecret = peerInfo.ss;
    };

    return this;
};

return cipher;
//////////////////////////////////////////////////////////////////////////////
});
