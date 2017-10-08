'use strict'

const xmpp = require('../index')
let server = null
const Client = require('node-xmpp-client')

const startServer = function (done) {
  // Sets up the server.
  server = new xmpp.C2S.TCPServer({
    port: 5222,
    domain: 'localhost',
  })

  // On connection event. When a client connects.
  server.on('connection', (client) => {
    // That's the way you add mods to a given server.

    // Allows the developer to register the jid against anything they want
    client.on('register', (opts, cb) => {
      console.log('REGISTER')
      cb(true) // eslint-disable-line
    })

    // Allows the developer to authenticate users against anything they want.
    client.on('authenticate', (opts, cb) => {
      console.log('server:', opts.username, opts.password, 'AUTHENTICATING')
      if (opts.password === 'secret') {
        console.log('server:', opts.username, 'AUTH OK')
        cb(null, opts)
      } else {
        console.log('server:', opts.username, 'AUTH FAIL')
        cb(false) // eslint-disable-line
      }
    })

    client.on('online', () => {
      console.log('server:', client.jid.local, 'ONLINE')
    })

    // Stanza handling
    client.on('stanza', (stanza) => {
      console.log('server:', client.jid.local, 'stanza', stanza.toString())
      const from = stanza.attrs.from
      stanza.attrs.from = stanza.attrs.to
      stanza.attrs.to = from
      client.send(stanza)
    })

    // On Disconnect event. When a client disconnects
    client.on('disconnect', () => {
      console.log('server:', client.jid.local, 'DISCONNECT')
    })
  })

  server.on('listening', done)
}

startServer(() => {
  const client1 = new Client({
    jid: 'client1@localhost',
    password: 'secret',
  })
  client1.on('online', () => {
    console.log('client1: online')
    client1.send(new xmpp.Stanza('message', { to: 'localhost' }).c('body').t('HelloWorld'))
  })
  client1.on('stanza', (stanza) => {
    console.log('client1: stanza', stanza.root().toString())
  })

  const client2 = new Client({
    jid: 'client2@localhost',
    password: 'notsecret',
  })
  client2.on('error', (error) => {
    console.log('client2', error)
  })
})
