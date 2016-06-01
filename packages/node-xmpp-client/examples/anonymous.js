'use strict'

/**
 * Echo Bot - the XMPP Hello World
 **/
var Client = require('../index')
var argv = process.argv

if (argv.length !== 3) {
  console.error(
    'Usage: node anonymous.js <server>'
  )
  process.exit(1)
}

var client = new Client({
  jid: argv[2],
  preferred: 'ANONYMOUS'
})

client.on('online', function () {
  console.log('online')
  client.send(new Client.Stanza('presence', { })
    .c('show').t('chat').up()
    .c('status').t('Happily echoing your <message/> stanzas')
  )
})

client.on('stanza', function (stanza) {
  if (stanza.is('message') &&
    // Important: never reply to errors!
    (stanza.attrs.type !== 'error')) {
    // Swap addresses...
    stanza.attrs.to = stanza.attrs.from
    delete stanza.attrs.from
    // and send back
    console.log('Sending response: ' + stanza.root().toString())
    client.send(stanza)
  }
})

client.on('error', function (e) {
  console.error(e)
})
