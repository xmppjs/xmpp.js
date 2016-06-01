'use strict'

/**
 * Echo Bot - the XMPP Hello World
 **/
var xmpp = require('../index')
var argv = process.argv

if (argv.length !== 4) {
  console.error('Usage: node echo_bot_oauth.js <my-jid> <oauth-token>')
  process.exit(1)
}

var cl = new xmpp.Client({
  jid: argv[2],
  host: 'talk.google.com',
  oauth2_token: argv[3],
  oauth2_auth: 'http://www.google.com/talk/protocol/auth'
})

cl.on('online', function () {
  var stanza = new xmpp.Stanza('presence', { })
    .c('show').t('chat').up()
    .c('status').t('Happily echoing your <message/> stanzas')
  cl.send(stanza)
})

cl.on('stanza', function (stanza) {
  if (stanza.is('message') &&
    // Important: never reply to errors!
    (stanza.attrs.type !== 'error')) {
    // Swap addresses...
    stanza.attrs.to = stanza.attrs.from
    delete stanza.attrs.from
    // and send back.
    cl.send(stanza)
  }
})

cl.on('error', function (e) {
  console.error(e)
})
