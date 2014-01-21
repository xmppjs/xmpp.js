'use strict';

var Client = require('../index')
  , argv = process.argv
  , ltx  = require('ltx')

if (argv.length < 6) {
    console.error('Usage: node send_message.js <my-jid> ' +
        '<my-password> <my-text> <jid1> [jid2] ... [jidN]')
    process.exit(1)
}

var client = new Client({ jid: argv[2],  password: argv[3] })

client.addListener('online', function(data) {
    console.log('Connected as ' + data.jid.user + '@' + data.jid.domain + '/' + data.jid.resource)
    argv.slice(5).forEach(function(to) {
        var stanza = new ltx.Element(
            'message',
            { to: to, type: 'chat' }
        ).c('body').t(argv[4])
        client.send(stanza)
    })

    // nodejs has nothing left to do and will exit
    client.end()
})

client.addListener('error', function(e) {
    console.error(e)
    process.exit(1)
})
