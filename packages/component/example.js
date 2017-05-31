'use strict'

/* eslint-disable no-console */

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

const {xml, component} = require('.') // For you require('@xmpp/component')
const entity = component()

// Emitted for any error
entity.on('error', err => {
  console.error('error', err)
})

// Let's log status changes
function logStatus(status) {
  console.log('🛈', status)
}
logStatus(entity.status)
entity.on('status', (status, ...args) => {
  logStatus(status, ...args)
})

// Emitted for incoming stanza _only_ (iq/presence/message) qualified with the right namespace
// entity.on('stanza', (stanza) => {
//   console.log('stanza', stanza.toString())
// })

// Emitted for incoming nonza _only_
// entity.on('nonza', (nonza) => {
//   console.log('nonza', nonza.toString())
// })

// useful for logging raw traffic
// Emitted for every incoming fragment
entity.on('input', data => console.log('⮈ IN ', data))
// Emitted for every outgoing fragment
entity.on('output', data => console.log('⮊ OUT', data))

// Emitted for any in our out XML root element
// useful for logging
// entity.on('element', (input, output) => {
//   console.log(output ? 'element =>' : 'element <=', (output || input).toString())
// })

// Runs if online and when online
entity.ready(jid => {
  console.log('jid', jid.toString())
  entity.send(xml`<presence/>`)
})

// "start" opens the socket and the XML stream
entity.start({uri: 'xmpp://localhost:5347', domain: 'node-xmpp.localhost'})
  .catch(err => {
    console.error('start failed', err)
  })

// Emitted when authentication is required
entity.on('authenticate', authenticate => {
  authenticate('foobar').catch(err => console.error('authentication failed', err))
})

process.on('unhandledRejection', (reason, p) => {
  console.log('Possibly Unhandled Rejection at: Promise ', p, ' reason: ', reason)
})
