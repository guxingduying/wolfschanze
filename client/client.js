require([
    'neoatlantis-crypto-js',
    'socket.io',
    'curve25519',
], function(
    crypto,
    socketIO,
    curve25519
){
//////////////////////////////////////////////////////////////////////////////

var ROOMID = '',
    PUBLICKEY = null,  // HEX
    PRIVATEKEY = null, // HEX
    MEMBERS = {};
var socket = socketIO('//');

//---------- generate local private and public key

PRIVATEKEY = crypto.util.encoding(new crypto.util.srand().bytes(32)).toHEX();
PUBLICKEY = curve25519.hexEncode(curve25519.cipher(curve25519.hexDecode(
    PRIVATEKEY
)));

function getSharedSecret(peerPublicKeyHEX){
    var sharedsecretHEX = curve25519.hexEncode(curve25519.cipher(
        curve25519.hexDecode(PRIVATEKEY),
        curve25519.hexDecode(peerPublicKeyHEX)
    ));
    return crypto.util.encoding(sharedsecretHEX, 'hex').toArrayBuffer();
};

// ---------- generate a new room id, or use existing one(aka invitied)

var urlhash = window.location.hash.slice(1).toLowerCase();
if(/^[0-9a-z]{14,}$/.test(urlhash)){
    // existing room
    ROOMID = urlhash;
} else {
    ROOMID = crypto.util.encoding(
        new crypto.util.srand().bytes(20)
    ).toBase32().slice(0, 14);
    window.location.hash = ROOMID;
};

// ---------- join room

socket.emit('join', ROOMID);


//////////////////////////////////////////////////////////////////////////////
});
