'use strict';

/* global XMPP */
var client = new XMPP.Client({
    websocketsURL: "ws://localhost:5280/xmpp-websocket/",
    jid: 'lloyd@evilprofessor.co.uk',
    password: 'password'
})

client.addListener(
    'online',
    function() {
        console.log('online')
        ['astro@spaceboyz.net'].forEach(
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
