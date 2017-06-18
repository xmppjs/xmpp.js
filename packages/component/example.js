'use strict'

/* eslint-disable no-console */

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

const {xml, component} = require('.') // For you require('@xmpp/component')
const entity = component()

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
  if (el.is('message') && el.attrs.from === entity.jid.toString()) {
    console.log('🗸', 'It\'s alive!')
  }
})

entity.on('online', jid => {
  console.log('jid', jid.toString())
  entity.send(xml`
    <message to='${jid.toString()}'>
      <body>hello</body>
    </message>
  `)
})

// "start" opens the socket and the XML stream
entity.start({uri: 'xmpp://localhost:5347', domain: 'node-xmpp.localhost'})
  .catch(err => {
    console.error('start failed', err)
  })

// Handle authentication to provide credentials
entity.handle('authenticate', authenticate => {
  return authenticate('foobar')
})

process.on('unhandledRejection', (reason, p) => {
  console.log('Possibly Unhandled Rejection at: Promise ', p, ' reason: ', reason)
})
