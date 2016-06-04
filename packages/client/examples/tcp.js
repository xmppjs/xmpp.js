/* eslint-disable */

'use strict'

const {Client, xml} = require('..') // require('@xmpp/client')
const entity = new Client()

// emitted for any error
entity.on('error', (err) => {
  console.error('error', err)
})

entity.on('close', () => {
  console.log('closed')
})

entity.on('reconnecting', () => {
  console.log('reconnecting')
})

entity.on('reconnected', () => {
  console.log('reconnected')
})


// emitted for incoming stanza _only_ (iq/presence/message) qualified with the right namespace
// entity.on('stanza', (stanza) => {
//   console.log('stanza', stanza.toString())
// })

// emitted for incoming nonza _only_
// entity.on('nonza', (nonza) => {
//   console.log('nonza', nonza.toString())
// })

// emitted for any in our out XML fragment
// useful for logging raw XML traffic
entity.on('fragment', (input, output) => {
  console.log(output ? '=>' : '<=', (output || input).trim())
})

// emitted for any in our out XML root element
// useful for logging
// entity.on('element', (input, output) => {
//   console.log(output ? 'element =>' : 'element <=', (output || input).toString())
// })

// emitted when the socket is open
entity.on('connect', () => {
  console.log('1. connected')
})

// emitted when the XMPP stream has open and we received the server stream
entity.on('open', (el) => {
  console.log('2. open')
})

// emitted when the XMPP entity is authenticated
entity.on('authenticated', () => {
  console.log('3. authenticated')
})

// emitted when the XMPP entity is ready
entity.on('ready', () => {
  console.log('4. ready')
})

// emitted when ready, authenticated and bound
entity.on('online', (jid) => {
  console.log('5. online', jid.toString())

  entity.send(xml`
    <iq to='localhost' id='ping' type='get'>
      <ping xmlns='urn:xmpp:ping'/>
    </iq>
  `)
})

// "start" opens the socket and the XML stream
entity.start('xmpp:localhost:5222')
  // resolves once online
  .then((jid) => {
    console.log('started', jid.toString())
  })
  // rejects for any error before online
  .catch(err => {
    console.error('start failed', err)
  })

// emitted when authentication is required
entity.on('authenticate', authenticate => {
  authenticate('node-xmpp', 'foobar')
    .then(() => {
      console.log('authenticated')
    })
    .catch((err) => {
      console.error('authentication failed', err)
    })
})

process.on('unhandledRejection', function (reason, p) {
  console.log('Possibly Unhandled Rejection at: Promise ', p, ' reason: ', reason)
})
