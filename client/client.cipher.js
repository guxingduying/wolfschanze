define([
    'neoatlantis-crypto-js',
    'curve25519'
], function(crypto, curve25519){
//////////////////////////////////////////////////////////////////////////////
function cipher(localID){
    var self = this;

    var peers = {};

    var LOCALIDENTITY = crypto.enigma.identity();
    LOCALIDENTITY.generate(localID, { algorithm: 'NECRAC128' });

    var blacklist = {};

    this.blacklistFingerprint = function(fingerprint){
        if(!crypto.util.type(fingerprint).isString()) return;
        blacklist[fingerprint] = true;
    };

    this.unblacklistFingerprint = function(fingerprint){
        if(!crypto.util.type(fingerprint).isString()) return;
        delete blacklist[fingerprint];
    };

    this.showLocalIdentity = function(){
        return LOCALIDENTITY.exportPublic();
    };

    this.showLocalFingerprint = function(){
        return LOCALIDENTITY.getFingerprint(true);
    };

    this.setPeer = function(peerPublic, checks){
        /*
           Set a public identity from a peer.
           Given public identity will only be accepted, when subject matches
           the id reported by socketIO, which is not very important, but
           should be.
        */
        try{
            var peer = crypto.enigma.identity();
            var fingerprint, subject;
            peer.loadPublic(peerPublic);
            fingerprint = peer.getFingerprint(true);
            subject = peer.getSubject();
            if(subject != checks.id) return false; // just a feature
            peers[fingerprint] = peer;
            return fingerprint;
        } catch(e){
            return false;
        };
    };

    this.filterPeer = function(fingerprintList){
        // all saved peer not in this list will be removed
        var removeList = [];
        for(var fp in peers){
            if(fingerprintList.indexOf(fp) < 0) removeList.push(fp);
        };
        for(var i in removeList) delete peers[removeList[i]];
    };

    this.getAuthenticator = function(){
        var list = [];
        for(var i in peers) list.push(i);
        list.sort();
        var joined = list.join(':');
        return crypto.util.encoding(new crypto.hash(5).hash(
            crypto.util.encoding(joined, 'ascii').toArrayBuffer()
        ).buffer).toBase32();
    };

    this.encrypt = function(plaintext){
        var plaintextBuf = crypto.util.encoding(plaintext).toArrayBuffer();
        var message = crypto.enigma.message();
        message.write(plaintextBuf);
        message.sign(LOCALIDENTITY);
        for(var i in peers){
            if(true === blacklist[i]) continue; // if this has been blocked
            try{
                message.encrypt(peers[i]);
            } catch(e){
                continue;
            };
        };
        return message.done();
    };

    this.decrypt = function(ciphertext){
        var ciphertextBuf = crypto.util.encoding(ciphertext).toArrayBuffer();
        var message = crypto.enigma.message();
        try{
            message.read(ciphertextBuf);
            message.decrypt(LOCALIDENTITY);
            return message.getPlaintext();
        } catch(e){
            return null;
        };
    };

    return this;
};

return cipher;
//////////////////////////////////////////////////////////////////////////////
});
