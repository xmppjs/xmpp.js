'use strict'

/*
 * example usage:
 *
 * node examples/answer_bot.js me@evilprofessor.co.uk password component.evilprofessor.co.uk
 *
 * Chats with the example component in example/send_message_component.js
 */

var Client = require('node-xmpp-client')
var argv = process.argv

if (argv.length < 5) {
  console.error('Usage: node answer_bot.js <my-jid> <my-password> ' +
    '<component-jid>')
  process.exit(1)
}

var component = argv[4]
var client = new Client({
  jid: argv[2],
  password: argv[3],
  host: 'localhost',
  reconnect: true
})

var x = 0
var old = x
var average = 0

setInterval(function () {
  var n = x - old
  console.log(n, average)
  average = (n + average) * 0.5
  old = x
}, 1e3)

var interval
var firstMessage = true

var c = 0
client.on('stanza', function (stanza) {
  console.log('Received stanza: ', c++, stanza.toString())
  if (stanza.is('message') && stanza.attrs.type === 'chat' && !stanza.getChild('delay')) {
    clearInterval(interval)
    if (firstMessage) console.log('Someone started chatting …')
    firstMessage = false
    var i = parseInt(stanza.getChildText('body'), 10)
    x = i
    var reply = new Client.Stanza('message', {
      to: stanza.attrs.from,
      from: stanza.attrs.to,
      type: 'chat'
    })
    reply.c('body').t(isNaN(i) ? 'i can count!' : ('' + (i + 1)))
    setTimeout(function () {
      client.send(reply)
    }, 321)
  }
})

client.on('online', function () {
  console.log('Client is online')
  firstMessage = true
  client.send('<presence/>')
  interval = setInterval(function () {
    if (!firstMessage) return
    //         firstMessage = false
    console.log('Start chatting …')
    var reply = new Client.Stanza('message', {
      to: component,
      type: 'chat'
    })
    reply.c('body').t('0')
    client.send(reply)
  }, 321)
})

client.on('offline', function () {
  console.log('Client is offline')
})

client.on('connect', function () {
  console.log('Client is connected')
})

client.on('reconnect', function () {
  console.log('Client reconnects …')
})

client.on('disconnect', function (e) {
  console.log('Client is disconnected', client.connection.reconnect, e)
})

client.on('error', function (e) {
  console.error(e)
  process.exit(1)
})

process.on('exit', function () {
  client.end()
})
