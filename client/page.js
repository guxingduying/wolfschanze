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

function redrawMemberIDs(){
    // set contents of all elements with 'data-socket-id' with associated
    // user identifying name.
    $('[data-socket-id]').each(function(){
        var value = $(this).attr('data-socket-id');
        var memberInfo = MEMBERS[value];
        if(!memberInfo){
            // If user info lost(may due to logged out user), we will try to
            // preserve already rendered info. But if this is impossible, which
            // should be rarely so, a 'unknown user' will be rendered.
            if('' != $(this).text()) return;
            $(this).text('未知用户');
        } else {
            // if we have got member info, we will always try to replace the
            // display with this new update.
            $(this).text(MEMBERS[value].name || value);
        };
    });
}

function redrawMembers(){
    $('#members').empty();
    for(var socketID in MEMBERS){
        if(socketID === LOCALID) continue;
        $('<li>')
            .addClass('list-group-item')
            .append(
                $('<strong>')
                    .addClass('list-group-item-heading')
                    .attr('data-socket-id', socketID)
            )
            .append(
                $('<p>')
                    .addClass('list-group-item-text')
                    .text(MEMBERS[socketID].fingerprint)
            )
        .appendTo('#members');
    };
    redrawMemberIDs();
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

function updateNewMessage(d, local){
    var body = d.body, senderID = d.from;
    var newEntry = $('<div>').appendTo('#history');
    newEntry.append(
        $('<span>').addClass((local?'author-local':'author-remote'))
            .append($('<span>').text('['))
            .append($('<span>').attr('data-socket-id', senderID))
            .append($('<span>').text(']'))
    );
    newEntry.append($('<span>').text('说: '));
    newEntry.append($('<span>').text(body).addClass('text'));
    redrawMemberIDs();
};


// ---------- listen to user events

$(function(){
    $('#send-message').click(function(){
        var message = $('#new-message').val().trim();
        if(!message) return;
        emit('send message', message);
        $('#new-message').val('');
        updateNewMessage({ body: message, from: LOCALID }, true);
    });

    $('#localid').focusout(function(){
        $(this).removeClass('changing');
        emit('change nickname', $(this).val());
    }).keypress(function(){
        $(this).addClass('changing');
    })
});


// ---------- define return function and event handler

var ret = function update(v){
    // use this function to update the page with given parameters
    if(undefined !== v.members) updateMembers(v.members);
    if(undefined !== v.localID) updateLocalID(v.localID);
    if(undefined !== v.authenticator) updateAuthenticator(v.authenticator);
    if(undefined !== v.message) updateNewMessage(v.message, false);
};
ret.on = addCallback;
return ret;

//////////////////////////////////////////////////////////////////////////////
});
