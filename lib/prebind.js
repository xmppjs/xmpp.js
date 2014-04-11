'use strict';
var argv = require('minimist')(process.argv.slice(2)),
    XMPP = require('../index');

delete argv._;
var client = new XMPP.Client(argv);

client.on('error',function(err){
    console.warn(new Error(err));
    process.exit();
});
client.on('online',function(){
    console.log({rid:client.connection.rid,sid:client.connection.sid});
    process.exit();
});