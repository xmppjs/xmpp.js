'use strict'

var Client = require('../index')
var argv = process.argv

if (argv.length < 6) {
  console.error('Usage: node send_message.js <my-jid> ' +
    '<my-password> <my-text> <jid1> [jid2] ... [jidN]')
  process.exit(1)
}

var client = new Client({jid: argv[2], password: argv[3]})

client.connection.socket.on('error', function (error) {
  console.error(error)
  process.exit(1)
})

client.on('online', function (data) {
  console.log('Connected as ' + data.jid.local + '@' + data.jid.domain + '/' + data.jid.resource)
  argv.slice(5).forEach(function (to) {
    var stanza = new Client.Stanza('message', {to: to, type: 'chat'})
      .c('body').t(argv[4])
    client.send(stanza)
  })

  // nodejs has nothing left to do and will exit
  client.end()
})

client.on('error', function (err) {
  console.error(err)
  process.exit(1)
})
