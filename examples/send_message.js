'use strict';

var xmpp = require('../lib/node-xmpp')
  , argv = process.argv

if (argv.length < 6) {
    console.error('Usage: node send_message.js <my-jid> ' +
        '<my-password> <my-text> <jid1> [jid2] ... [jidN]')
    process.exit(1)
}

var cl = new xmpp.Client({ jid: argv[2],  password: argv[3] })

cl.addListener('online', function(data) {
    console.log('Connected as ' + data.jid.user + '@' + data.jid.domain + '/' + data.jid.resource)
    argv.slice(5).forEach(function(to) {
        var stanza = new xmpp.Element(
            'message',
            { to: to, type: 'chat' }
        ).c('body').t(argv[4])
        cl.send(stanza)
    })

    // nodejs has nothing left to do and will exit
    cl.end()
})

cl.addListener('error', function(e) {
    console.error(e)
    process.exit(1)
})