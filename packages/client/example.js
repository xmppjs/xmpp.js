'use strict'

/* eslint-disable no-console */

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

const {xml, Client} = require('./index') // For you; require('@xmpp/client')
const client = new Client()

// Log errors
client.on('error', err => {
  console.error('❌', err.toString())
})

// Log status changes
client.on('status', (status, value) => {
  console.log('🛈', status, value ? value.toString() : '')
})

// Useful for logging raw traffic
// Emitted for every incoming fragment
client.on('input', data => console.log('⮈', data))
// Emitted for every outgoing fragment
client.on('output', data => console.log('⮊', data))

// Useful for logging XML traffic
// Emitted for every incoming XML element
// client.on('element', data => console.log('⮈', data))
// Emitted for every outgoing XML element
// client.on('send', data => console.log('⮊', data))

client.on('stanza', el => {
  if (el.is('presence') && el.attrs.from === client.jid.toString()) {
    console.log('🗸', 'available, ready to receive <message/>s')
  }
})

client.on('online', jid => {
  console.log('jid', jid.toString())
  client.send(xml('presence'))
})

// "start" opens the socket and the XML stream
client.start('localhost') // Auto
// client.start('xmpp://localhost:5222') // TCP
// client.start('xmpps://localhost:5223') // TLS
// client.start('ws://localhost:5280/xmpp-websocket') // Websocket
// client.start('wss://localhost:5281/xmpp-websocket') // Secure WebSocket
  .catch(err => {
    console.error('start failed', err)
  })

// Handle authentication to provide credentials
client.handle('authenticate', authenticate => {
  return authenticate('node-xmpp', 'foobar')
})

// Handle binding to choose resource - optional
client.handle('bind', bind => {
  return bind('example')
})

process.on('unhandledRejection', (reason, p) => {
  console.log('Possibly Unhandled Rejection at: Promise ', p, ' reason: ', reason)
})
