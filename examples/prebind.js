var XMPP = require('node-xmpp-client');

var client = new XMPP({
    jid: 'me@example.com',
    password: 'secret',
    boshURL: 'http://example.com/http-bind',
    preferred: 'PLAIN',
    wait: '60',
    prebind:function(err,data){
      /*
        data.sid
        data.rid
      */
    }
});