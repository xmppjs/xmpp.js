'use strict'

var xmpp = require('../index')
var c2s = null
var debug = require('debug')('server-and-client')
var Client = require('node-xmpp-client')
var Stanza = require('node-xmpp-core').Stanza

var startServer = function (done) {
  // Sets up the server.
  c2s = new xmpp.WebSocketServer({
    port: 5280,
    domain: 'localhost'
  })

  // On Connect event. When a client connects.
  c2s.on('connect', function (client) {
    // That's the way you add mods to a given server.

    // Allows the developer to register the jid against anything they want
    client.on('register', function (opts, cb) {
      debug('REGISTER')
      cb(true)
    })

    // Allows the developer to authenticate users against anything they want.
    client.on('authenticate', function (opts, cb) {
      debug('AUTH ' + opts.jid + ' -> ' + opts.password)
      if (opts.password === 'secret') {
        debug('SUCCESS')
        return cb(null, opts)
      }
      debug('FAIL')
      cb(false)
    })

    client.on('online', function () {
      debug('ONLINE')
    })

    // Stanza handling
    client.on('stanza', function (stanza) {
      debug('STANZA', stanza.root().toString())
      var from = stanza.attrs.from
      stanza.attrs.from = stanza.attrs.to
      stanza.attrs.to = from
      client.send(stanza)
    })

    // On Disconnect event. When a client disconnects
    client.on('disconnect', function () {
      debug('DISCONNECT')
    })
  })

  if (done) done()
}

startServer(function () {
  var client1 = new Client({
    websocket: { url: 'ws://localhost:5280' },
    jid: 'client1@localhost',
    password: 'secret'
  })
  client1.on('online', function (data) {
    debug('client1 is online')
    debug('client1', data)
    client1.send(new Stanza('message', { to: 'localhost' }).c('body').t('HelloWorld'))
  })
  client1.on('stanza', function (stanza) {
    debug('client1', 'received stanza', stanza.root().toString())
  })

  var client2 = new Client({
    websocket: { url: 'ws://localhost:5280' },
    jid: 'client2@localhost',
    password: 'notsecret'
  })
  client2.on('error', function (error) {
    debug('client2 auth failed')
    debug('client2', error)
  })
})
