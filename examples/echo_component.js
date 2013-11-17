'use strict';

/**
 * Echo Component - the XMPP Hello World
 **/
var xmpp = require('../lib/node-xmpp')
  , argv = process.argv

if (argv.length !== 6) {
    console.error('Usage: node echo_bot.js <my-jid> <my-password> <host> <port>')
    process.exit(1)
}

var cl = new xmpp.Component({
    jid: argv[2],
    password: argv[3],
    host: argv[4],
    port: argv[5]
})

cl.on('online', function() {
    var stanza = new xmpp.Element('presence', { type: 'chat'})
        .c('show').t('chat').up()
        .c('status')
        .t('Happily echoing your <message/> stanzas')
    cl.send(stanza)
})
cl.on('stanza', function(stanza) {
    if (stanza.is('message') &&
        // Important: never reply to errors!
        (stanza.attrs.type !== 'error')) {

        // Swap addresses...
        var me = stanza.attrs.to
        stanza.attrs.to = stanza.attrs.from
        stanza.attrs.from = me
        // and send back.
        cl.send(stanza)
    }
})

cl.on('error', function(e) {
    console.error(e)
})