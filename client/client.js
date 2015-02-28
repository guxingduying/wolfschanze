require([
    'page',
    'client.cipher',
    'socket.io',
    'neoatlantis-crypto-js',
], function(
    PAGE,
    cipher,
    socketIO,
    crypto
){
var CONSTANT_NICKNAME_MAXLENGTH = 20,
    CONSTANT_NICKNAME_MINLENGTH = 2;
//////////////////////////////////////////////////////////////////////////////

var ROOMID = '',
    CIPHER = null,
    MEMBERS = {},
    LOCALID = null,
    LOCALNAME = null; // TODO i18n
var socket = socketIO('//');

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

// ---------- handle connection specific initialization

socket.on('connect', function(){
    MEMBERS = {};
    LOCALID = socket.io.engine.id;
    CIPHER = new cipher(LOCALID);
    console.log('Local Socket ID: ' + LOCALID);

    // ------ join room

    socket.emit('publish name', LOCALNAME);
    socket.emit('publish identity', CIPHER.showLocalIdentity());
    socket.on('error-join-room', function(){});
    socket.emit('join', ROOMID);

    // ------ upon receving broadcasted messages

    socket.on('broadcast', function(d){
        var from = d.from, data = d.data;
        if(from == LOCALID) return;
        if(!MEMBERS[from]) MEMBERS[from] = {};

        // if received an update of nickname
        if(
            crypto.util.type(data.nickname).isString() &&
            data.nickname.length < CONSTANT_NICKNAME_MAXLENGTH &&
            data.nickname.length > CONSTANT_NICKNAME_MINLENGTH
        ){
            MEMBERS[from]['nickname'] = data.nickname;
        };

        // if received a message
        if(crypto.util.type(data.message).isArrayBuffer()){
            // TODO confirm message decrypted is signed by the source socket
            // that we have seen by validating its socketID against signer's
            // subject. This has to be added to client.cipher.js.
            var plaintext = CIPHER.decrypt(data.message);
            plaintext = crypto.util.encoding(plaintext).toUTF16();
            if(plaintext) PAGE({ message: { body: plaintext, from: from }});
        };

    });

    // ------ upon getting member update

    socket.on('update', function(data){
        // remove non-existent memebers(may have been exited)
        var del = [];
        for(var uid in MEMBERS) if(!data[uid]) del.push(uid);
        for(var i in del) delete MEMBERS[del[i]];
        // add new members not known
        var fps = [];
        for(var uid in data){
            if(!MEMBERS[uid]) MEMBERS[uid] = {};
            MEMBERS[uid]['fingerprint'] = CIPHER.setPeer(
                data[uid].identity,
                { id: uid }
            );
            MEMBERS[uid]['identity'] = data[uid].identity;
            MEMBERS[uid]['name'] = data[uid].name;
            fps.push(MEMBERS[uid]['fingerprint']);
        };
        // call CIPHER to remove unused member registries.
        CIPHER.filterPeer(fps);
        // get new CIPHER authenticator
        PAGE({authenticator: CIPHER.getAuthenticator()})
        // update page
        PAGE({members: MEMBERS});
    });

    // ----- initialize page
    PAGE({localID: LOCALID});

}); // end of 'on socket connection'


// ---------- listen to page events(user events)

PAGE.on('send message', function(data){
    var buf = crypto.util.encoding(data).toArrayBuffer();
    var ciphertext = CIPHER.encrypt(buf);
    socket.emit('broadcast', { message: ciphertext });
});

PAGE.on('change nickname', function(nickname){
    socket.emit('publish name', nickname);
});


//////////////////////////////////////////////////////////////////////////////
});
