'use strict'

/* eslint-disable no-console */

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

const {xml, Component} = require('.') // For you require('@xmpp/component')
const component = new Component()

// Log errors
component.on('error', err => {
  console.error('❌', err.toString())
})

// Log status changes
component.on('status', (status, value) => {
  console.log('🛈', status, value ? value.toString() : '')
})

// Useful for logging raw traffic
// Emitted for every incoming fragment
component.on('input', data => console.log('⮈', data))
// Emitted for every outgoing fragment
component.on('output', data => console.log('⮊', data))

// Useful for logging XML traffic
// Emitted for every incoming XML element
// component.on('element', data => console.log('⮈', data))
// Emitted for every outgoing XML element
// component.on('send', data => console.log('⮊', data))

component.on('stanza', el => {
  if (el.is('message') && el.attrs.from === component.jid.toString()) {
    console.log('🗸', 'It\'s alive!')
  }
})

component.on('online', jid => {
  console.log('jid', jid.toString())
  component.send(
    xml('message', {to: jid.toString()},
      xml('body', {}, 'hello')
    )
  )
})

// "start" opens the socket and the XML stream
component.start({uri: 'xmpp://localhost:5347', domain: 'node-xmpp.localhost'})
  .catch(err => {
    console.error('start failed', err)
  })

// Handle authentication to provide credentials
component.handle('authenticate', authenticate => {
  return authenticate('foobar')
})

process.on('unhandledRejection', (reason, p) => {
  console.log('Possibly Unhandled Rejection at: Promise ', p, ' reason: ', reason)
})
