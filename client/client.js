require([
    'neoatlantis-crypto-js',
    'socket.io',
    'curve25519',
], function(
    crypto,
    socketIO,
    curve25519
){
var CONSTANT_NICKNAME_MAXLENGTH = 20,
    CONSTANT_NICKNAME_MINLENGTH = 2;
//////////////////////////////////////////////////////////////////////////////

var ROOMID = '',
    PUBLICKEY = null,  // HEX
    PRIVATEKEY = null, // HEX
    MEMBERS = {},
    LOCALID = null;
var socket = socketIO('//');
socket.on('connect', function(){
    LOCALID = socket.io.engine.id;
    console.log('Local Socket ID: ' + LOCALID);
});

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

socket.on('error-join-room', function(){});
socket.emit('join', ROOMID);


// ---------- upon receving broadcasted messages

socket.on('broadcast', function(d){
    var from = d.from, data = d.data;
    if(from == LOCALID) return;
    if(!MEMBERS[from]) MEMBERS[from] = {};

    // if received a public key the first time from a member
    if(/^[0-9a-f]{64}$/i.test(data.publicKey)){
        if(undefined === MEMBERS[from]['key']){
            var sharedsecret = getSharedSecret(data.publicKey);
            MEMBERS[from]['key'] = sharedsecret;
            MEMBERS[from]['key.hash'] =
                new crypto.hash(6).hash(sharedsecret).hex;
        };
    };

    // if received an update of nickname
    if(
        crypto.util.type(data.nickname).isString() &&
        data.nickname.length < CONSTANT_NICKNAME_MAXLENGTH &&
        data.nickname.length > CONSTANT_NICKNAME_MINLENGTH
    ){
        MEMBERS[from]['nickname'] = data.nickname;
    };

});

// ---------- broadcast local public key
function broadcastLocalPublicKey(){
    socket.emit('broadcast', {publicKey: PUBLICKEY});
};
broadcastLocalPublicKey();

// ---------- upon getting member update

socket.on('update', function(data){
    var del = [];
    for(var uid in MEMBERS) if(data.indexOf(uid) < 0) del.push(uid);
    for(var i in del) delete MEMBERS[del[i]];
    var sawNewMember = false;
    for(var i in data){
        var uid = data[i];
        if(!MEMBERS[uid]){
            MEMBERS[uid] = {};
            sawNewMember = true;
        };
    };
    if(sawNewMember) broadcastLocalPublicKey();
});

//////////////////////////////////////////////////////////////////////////////
});
