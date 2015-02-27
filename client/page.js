define([
    'jquery',
], function(
    $
){
//////////////////////////////////////////////////////////////////////////////

// ---------- some global variables

var LOCALID = null, MEMBERS = {};


// ---------- event center

var CALLBACKS = {};
function addCallback(name, callback){
    if(!CALLBACKS[name]) CALLBACKS[name] = [];
    CALLBACKS[name].push(callback);
};
function emit(name, data){
    if(!CALLBACKS[name]) return;
    for(var i in CALLBACKS[name]) CALLBACKS[name][i](data);
};


// ---------- page logic

function redrawMembers(){
    $('#members').empty();
    for(var socketID in MEMBERS){
        if(socketID === LOCALID) continue;
        $('<li>')
            .addClass('list-group-item')
            .append(
                $('<strong>')
                    .addClass('list-group-item-heading')
                    .text(MEMBERS[socketID].name || socketID)
            )
            .append(
                $('<p>')
                    .addClass('list-group-item-text')
                    .text(MEMBERS[socketID].fingerprint)
            )
        .appendTo('#members');
    }
};

function updateMembers(m){
    MEMBERS = m;
    redrawMembers();
};

function updateLocalID(d){
    LOCALID = d;
    redrawMembers();
    $('#localid').val(d);
};

function updateAuthenticator(d){
    $('#authenticator').text(d);
};

function updateNewMessage(d){
    var body = d.body, senderID = d.from;
    $('#history').append($('<div>').text(body));
    console.log(d);
}


// ---------- listen to user events

$(function(){
    $('#send-message').click(function(){
        var message = $('#new-message').val().trim();
        if(!message) return;
        emit('send message', message);
        $('#new-message').val('');
        // TODO display directly to the history
    });
});


// ---------- define return function and event handler

var ret = function update(v){
    // use this function to update the page with given parameters
    if(undefined !== v.members) updateMembers(v.members);
    if(undefined !== v.localID) updateLocalID(v.localID);
    if(undefined !== v.authenticator) updateAuthenticator(v.authenticator);
    if(undefined !== v.message) updateNewMessage(v.message);
};
ret.on = addCallback;
return ret;

//////////////////////////////////////////////////////////////////////////////
});
