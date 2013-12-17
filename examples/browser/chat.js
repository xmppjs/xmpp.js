'use strict';

/* global XMPP */
var cl = new XMPP.Client({
    /*websocketsURL: "ws://localhost:5280/",*/
    boshURL: 'https://beta.buddycloud.org/http-bind/',
    jid: 'test@example.com',
    password: '***'
})

cl.addListener(
    'online',
    function() {
        ['astro@spaceboyz.net'].forEach(
           function(to) {
                var stanza = new XMPP.Element('message', { to: to, type: 'chat'})
                    .c('body')
                    .t('Hello from browser')
                cl.send(stanza)
            }
       )
        // nodejs has nothing left to do and will exit
        cl.end()
    }
)

cl.addListener(
    'error',
    function(e) {
        console.error(e)
    }
)