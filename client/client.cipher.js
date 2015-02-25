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

    return this;
};

return cipher;
//////////////////////////////////////////////////////////////////////////////
});
