/* eslint strict: ["error", "function"] */
/* eslint-disable no-console */

;(function(global) {
  'use strict'

  if (global.process) {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
  }

  const {xmpp, xml} =
    typeof require === 'undefined' ? global.xmpp : require('..') // For you; require('@xmpp/client')
  const {client} = xmpp()

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

    client.send(
      xml(
        'message',
        {to: 'sonny@jabberfr.org', type: 'chat'},
        xml('body', {}, 'hello')
      )
    )
  })

  // "start" opens the socket and the XML stream
  client
    .start('jabberfr.org') // Auto
    // .start('xmpp://localhost:5222') // TCP
    // .start('xmpps://localhost:5223') // TLS
    // .start('ws://localhost:5280/xmpp-websocket') // Websocket
    // .start('wss://localhost:5281/xmpp-websocket') // Secure WebSocket
    .catch(err => {
      console.error('start failed', err)
    })

  // Handle authentication to provide credentials
  client.handle('authenticate', authenticate => {
    return authenticate('sonny', 'foobar')
  })

  // Handle binding to choose resource - optional
  client.handle('bind', bind => {
    return bind('example')
  })
})(typeof global === 'undefined' ? this : global)
