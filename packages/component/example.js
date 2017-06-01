'use strict'

/* eslint-disable no-console */

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

const {xml, component} = require('.') // For you require('@xmpp/component')
const entity = component()

// Emitted for any error
entity.listen('error', err => {
  console.error('error', err)
})

// Let's log status
entity.listen('status', status => {
  console.log('🛈', status)
})

// Emitted for incoming stanza _only_ (iq/presence/message) qualified with the right namespace
// entity.listen('stanza', stanza => console.log('stanza', stanza.toString()))

// Emitted for incoming nonza _only_
// entity.listen('nonza', nonza => console.log('nonza', nonza.toString()))

// useful for logging raw traffic
// Emitted for every incoming fragment
entity.listen('input', data => console.log('⮈ IN ', data))
// Emitted for every outgoing fragment
entity.listen('output', data => console.log('⮊ OUT', data))

// Emitted for incoming stanza and nonza
// entity.listen('element', element => console.log(element.toString)))

// Emitted for outgoing stanza and nonza
// entity.listen('send', element => console.log(element.toString)))

entity.listen('online', jid => {
  console.log('jid', jid.toString())
  entity.send(xml`<presence/>`)
})

// "start" opens the socket and the XML stream
entity.start({uri: 'xmpp://localhost:5347', domain: 'node-xmpp.localhost'})
  .catch(err => {
    console.error('start failed', err)
  })

// Emitted when authentication is required
entity.listen('authenticate', authenticate => {
  authenticate('foobar').catch(err => console.error('authentication failed', err))
})

process.on('unhandledRejection', (reason, p) => {
  console.log('Possibly Unhandled Rejection at: Promise ', p, ' reason: ', reason)
})
