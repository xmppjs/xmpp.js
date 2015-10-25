'use strict'

/*
 * example usage:
 *
 * node examples/send_message_component.js component.evilprofessor.co.uk password localhost 5347
 *
 * Replies to an incoming chat message with 'hello'
 */

var Component = require('..')
var Stanza = require('node-xmpp-core').Stanza

var argv = process.argv

if (argv.length < 6) {
  console.error('Usage: node send_message_component.js <my-jid> <my-password> ' +
    '<server> <port>')
  process.exit(1)
}

var component = new Component({
  jid: argv[2],
  password: argv[3],
  host: argv[4],
  port: Number(argv[5]),
  reconnect: true
})

component.on('online', function () {
  console.log('Component is online')

  component.on('stanza', function (stanza) {
    console.log('Received stanza: ', stanza.toString())
    if (stanza.is('message')) {
      var reply = new Stanza('message', { to: stanza.attrs.from, from: stanza.attrs.to, type: 'chat' })
      reply.c('body').t('Hello')
      component.send(reply)
    }
  })

// nodejs has nothing left to do and will exit
// component.end()
})

component.on('offline', function () {
  console.log('Component is offline')
})

component.on('connect', function () {
  console.log('Component is connected')
})

component.on('reconnect', function () {
  console.log('Component reconnects …')
})

component.on('disconnect', function (e) {
  console.log('Component is disconnected', e)
})

component.on('error', function (e) {
  console.error(e)
  process.exit(1)
})

process.on('exit', function () {
  component.end()
})
