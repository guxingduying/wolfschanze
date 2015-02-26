define([
    'jquery',
], function(
    $
){
//////////////////////////////////////////////////////////////////////////////

function updateMembers(m){
    $('body').html(JSON.stringify(m));
};


return function update(values){
    // use this function to update the page with given parameters
    if(undefined !== values.members) updateMembers(values.members);
};

//////////////////////////////////////////////////////////////////////////////
});
