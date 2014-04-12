'use strict';
var XMPP = require('node-xmpp-client');

(new XMPP({
    jid: 'me@example.com',
    password: 'secret',
    boshURL: 'http://example.com/http-bind',
    preferred: 'PLAIN',
    wait: '60',
    prebind:function(err,data){
        if(err) throw new Error(err);
        else return data;
        /*
            data.sid
            data.rid
        */
    }
}))();