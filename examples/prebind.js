'use strict';

var XMPP = require('../index')

var prebind = new XMPP({
    jid: 'me@example.com',
    password: 'secret',
    preferred: 'PLAIN',
    wait: '60',
    bosh: {
        url: 'http://example.com/http-bind',
        prebind: function(error, data) {
            if (error) throw new Error(error)
            return data
            /*
                data.sid
                data.rid
             */
        }
    }
})

prebind.on('online', function() { console.log('Connected') })
