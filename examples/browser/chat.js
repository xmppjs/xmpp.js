'use strict';

/* global XMPP */
/* Note these are connection details for a local dev server :) */
var client = new XMPP.Client({
//    websocketsURL: 'ws://localhost:5280/xmpp-websocket/',
    boshURL: 'http://localhost:5280/http-bind/',
    jid: 'lloyd@localhost',
    password: 'password',
    preferred: 'PLAIN'
})

client.addListener(
    'online',
    function() {
        console.log('online')
        var recipients = ['astro@spaceboyz.net']
        recipients.forEach(
           function(to) {
                var stanza = new XMPP.Element('message', { to: to, type: 'chat'})
                    .c('body')
                    .t('Hello from browser')
                client.send(stanza)
            }
       )
    }
)

client.addListener(
    'error',
    function(e) {
        console.error(e)
    }
)
