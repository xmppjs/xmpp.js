'use strict'

const xmpp = require('../index')
let c2s = null
const debug = require('debug')('server-and-client')
const Client = require('node-xmpp-client')
const Stanza = require('node-xmpp-core').Stanza

const startServer = function (done) {
  // Sets up the server.
  c2s = new xmpp.WebSocketServer({
    port: 5280,
    domain: 'localhost',
  })

  // On Connect event. When a client connects.
  c2s.on('connect', (client) => {
    // That's the way you add mods to a given server.

    // Allows the developer to register the jid against anything they want
    client.on('register', (opts, cb) => {
      debug('REGISTER')
      cb(true) // eslint-disable-line
    })

    // Allows the developer to authenticate users against anything they want.
    client.on('authenticate', (opts, cb) => {
      debug('AUTH ' + opts.jid + ' -> ' + opts.password)
      if (opts.password === 'secret') {
        debug('SUCCESS')
        return cb(null, opts)
      }
      debug('FAIL')
      cb(false) // eslint-disable-line
    })

    client.on('online', () => {
      debug('ONLINE')
    })

    // Stanza handling
    client.on('stanza', (stanza) => {
      debug('STANZA', stanza.root().toString())
      const from = stanza.attrs.from
      stanza.attrs.from = stanza.attrs.to
      stanza.attrs.to = from
      client.send(stanza)
    })

    // On Disconnect event. When a client disconnects
    client.on('disconnect', () => {
      debug('DISCONNECT')
    })
  })

  if (done) done()
}

startServer(() => {
  const client1 = new Client({
    websocket: { url: 'ws://localhost:5280' },
    jid: 'client1@localhost',
    password: 'secret',
  })
  client1.on('online', (data) => {
    debug('client1 is online')
    debug('client1', data)
    client1.send(new Stanza('message', { to: 'localhost' }).c('body').t('HelloWorld'))
  })
  client1.on('stanza', (stanza) => {
    debug('client1', 'received stanza', stanza.root().toString())
  })

  const client2 = new Client({
    websocket: { url: 'ws://localhost:5280' },
    jid: 'client2@localhost',
    password: 'notsecret',
  })
  client2.on('error', (error) => {
    debug('client2 auth failed')
    debug('client2', error)
  })
})
