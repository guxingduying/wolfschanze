define([
    'jquery',
], function(
    $
){
//////////////////////////////////////////////////////////////////////////////

// ---------- some global variables

var LOCALID = null, LOCALNAME = null, LOCALFINGERPRINT = null, MEMBERS = {};


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
    // ----- local info
    $('#localid').val((LOCALNAME?LOCALNAME:LOCALID));
    $('#localfingerprint').val(LOCALFINGERPRINT);
    // ----- member list
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

function redrawInput(){
    $('#sendbox-cover').hide();
    $('#sendbox').show();
};


function updateMembers(m){
    MEMBERS = m;
    redrawMembers();
};

function updateLocalID(d){
    LOCALID = d;
    redrawMembers();
};

function updateLocalName(d){
    LOCALNAME = d;
    redrawMembers();
}

function updateLocalFingerprint(d){
    LOCALFINGERPRINT = d;
    redrawMembers();
};

function updateAuthenticator(d){
    $('#authenticator').text(d);
};

function updateNewMessage(d, local){
    var body = d.body, senderID = d.from;
    var newEntry = $('<div>').prependTo('#history');
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

function updateConnected(d){
    if(true !== d) return;
    redrawInput();
};


// ---------- listen to user events

$(function(){
    $('#main').show();
    $('#nojs').hide();

    $('#send-message').click(function(){
        var message = $('#new-message').val().trim();
        if(!message) return;
        emit('send message', message);
        $('#new-message').val('');
        updateNewMessage({ body: message, from: LOCALID }, true);
    });

    $('#localid').focusout(function(){
        $(this).removeClass('changing');
        LOCALNAME = $(this).val();
        emit('change nickname', LOCALNAME);
    }).keypress(function(){
        $(this).addClass('changing');
    });

    $('#history-container').scroll(function(){
        console.log($(this).scrollTop());
    })
});


// ---------- define return function and event handler

var ret = function update(v){
    // use this function to update the page with given parameters
    if(undefined !== v.members) updateMembers(v.members);
    if(undefined !== v.localID) updateLocalID(v.localID);
    if(undefined !== v.localName) updateLocalName(v.localName);
    if(undefined !== v.localFingerprint) updateLocalFingerprint(v.localFingerprint);
    if(undefined !== v.authenticator) updateAuthenticator(v.authenticator);
    if(undefined !== v.message) updateNewMessage(v.message, false);
    if(undefined !== v.connected) updateConnected(v.connected);
};
ret.on = addCallback;
return ret;

//////////////////////////////////////////////////////////////////////////////
});
