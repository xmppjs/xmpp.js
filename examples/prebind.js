'use strict';

var XMPP = require('node-xmpp-client')

(new XMPP({
    jid: 'me@example.com',
    password: 'secret',
    boshURL: 'http://example.com/http-bind',
    preferred: 'PLAIN',
    wait: '60',
    prebind: function(error, data) {
        if (error) throw new Error(error)
        
        return data
        /*
            data.sid
            data.rid
        */
    }
}))()
