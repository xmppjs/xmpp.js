'use strict'

const xmpp = require('../index')
let server = null
const Component = require('node-xmpp-component')

const startServer = function (done) {
  // Sets up the server.
  server = new xmpp.ComponentServer({
    port: 5347,
  })
  server.on('connect', (component) => {
    // Component auth is two step:
    // first, verify that the component is allowed to connect at all,
    // then verify the password is correct
    component.on('verify-component', (jid, cb) => {
      if (jid.toString() === 'component.example.com') {
        return cb(null, 'ThePassword')
      }
      return cb('Unauthorized') // eslint-disable-line
    })
    component.on('online', () => {
      console.log('ONLINE')
    })
    component.on('stanza', (stanza) => {
      console.log('STANZA', stanza.root().toString())
      // Here you could, for example, dispatch this to an existing C2S Server
      const from = stanza.attrs.from
      stanza.attrs.from = stanza.attrs.to
      stanza.attrs.to = from
      component.send(stanza)
    })
    component.on('disconnect', () => {
      console.log('DISCONNECT')
    })
  })

  server.on('listening', done)
}

startServer(() => {
  const component = new Component({
    jid: 'component.example.com',
    host: 'localhost',
    port: 5347,
    password: 'ThePassword',
  })
  component.on('online', () => {
    console.log('component is online')

    const stanza = new xmpp.Stanza('message', {
      to: 'testguy@example.com',
      from: 'fake@example.com',
    }).c('body').t('HelloWorld')

    component.send(stanza)
  })
  component.on('stanza', (stanza) => {
    console.log('component', 'received stanza', stanza.root().toString())
  })
})
