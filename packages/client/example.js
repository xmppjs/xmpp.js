'use strict'

/* eslint-disable no-console */

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

const {xml, client} = require('./index') // For you; require('@xmpp/client')
const entity = client()

// Log errors
entity.on('error', err => {
  console.error('❌', err.toString())
})

// Log status changes
entity.on('status', (status, value) => {
  console.log('🛈', status, value ? value.toString() : '')
})

// Useful for logging raw traffic
// Emitted for every incoming fragment
entity.on('input', data => console.log('⮈', data))
// Emitted for every outgoing fragment
entity.on('output', data => console.log('⮊', data))

// Useful for logging XML traffic
// Emitted for every incoming XML element
// entity.on('element', data => console.log('⮈', data))
// Emitted for every outgoing XML element
// entity.on('send', data => console.log('⮊', data))

entity.on('stanza', el => {
  if (el.is('presence') && el.attrs.from === entity.jid.toString()) {
    console.log('🗸', 'available, ready to receive <message/>')
  }
})

entity.on('online', jid => {
  console.log('jid', jid.toString())
  entity.send(xml`<presence/>`)
})

// "start" opens the socket and the XML stream
entity.start('localhost') // Auto
// entity.start('xmpp://localhost:5222') // TCP
// entity.start('xmpps://localhost:5223') // TLS
// entity.start('ws://localhost:5280/xmpp-websocket') // Websocket
// entity.start('wss://localhost:5281/xmpp-websocket') // Secure WebSocket
  .catch(err => {
    console.error('start failed', err)
  })

// Handle authentication to provide credentials
entity.handle('authenticate', authenticate => {
  return authenticate('node-xmpp', 'foobar')
})

// Handle binding to choose resource - optional
entity.handle('bind', bind => {
  return bind('example')
})

process.on('unhandledRejection', (reason, p) => {
  console.log('Possibly Unhandled Rejection at: Promise ', p, ' reason: ', reason)
})
