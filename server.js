var http = require('http').createServer(onHTTP),
    url = require('url'),
    fs = require('fs'),
    buffer = require('buffer'),
    io = require('socket.io')(http);

//////////////////////////////////////////////////////////////////////////////

function sendRoomUpdate(room){
    var sockets = io.sockets.adapter.rooms[room];
    var list = {};
    for (var socketID in sockets){
        var socket = io.sockets.connected[socketID];
        list[socketID] = {
            identity: socket.__data.identity || undefined,
        };
    };
    io.to(room).emit('update', list);
};

function onSocket(socket){
    socket.__data = {};

    socket.on('publish identity', function(buf){
        if(!buffer.Buffer.isBuffer(buf)) return;
        if(buf.length > 1536) return;
        socket.__data.identity = buf;
        if(socket.__data.room) sendRoomUpdate(socket.__data.room);
    });
    socket.on('join', function(room){
        if(socket.__data.room) return socket.emit('error-join-room');
        if(!/^[0-9a-z]{14,}$/i.test(room))
            return socket.emit('error-join-room');
        socket.join(room.toLowerCase());
        socket.__data.room = room;
        sendRoomUpdate(room);
        io.sockets.in(room).on('leave', function(){ sendRoomUpdate(room); });
    });
    socket.on('broadcast', function(data){
        if(!socket.__data.room) return;
        io.to(socket.__data.room).emit('broadcast', {
            from: socket.id,
            data: data,
        });
    });
};

//////////////////////////////////////////////////////////////////////////////

function onHTTP(req, res){
    var urls = url.parse(req.url);
    var filename = urls.pathname.slice(1);
    if('' == filename) filename = 'index.html';
    var searchPath = './client/' + filename;
    console.log(searchPath);
    fs.readFile(searchPath, function(err, file){
        if(err){
            res.writeHead(404);
            res.end();
            return;
        };
        res.writeHead(200);
        res.end(file);
    });
};

http.listen(1800);
io.on('connection', onSocket);
