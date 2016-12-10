/* eslint-disable */

'use strict'

const {Client, jid, xml} = require('./packages/client')
const client = new Client()

// emitted for any error
client.once('error', (err) => {
  console.log('errored', err)
})

/*
 * connection events
 */
// emitted when connection is established
// client.once('connect', function () {
  // console.log('connected')
  // client.open('localhost')
// })
// emitted when connection is closed
client.once('close', () => {
  console.log('closed')
})

/*
 * stream events
 */
// emitted when stream features are received
client.once('stream:features', (element) => {
  // console.log('features')
  // console.log('features', element.toString())
})
// emitted when stream is open
client.once('stream:open', () => {
  console.log('stream open')
})
// emitted when stream is closed
client.once('stream:close', () => {
  console.log('stream close')
})

/*
 * xml events
 */
// emitted for any incoming stanza or nonza
client.on('element', (el) => {
  // console.log(el.toString())
})
// emitted for any incoming stanza (iq, message, presence)
client.on('stanza', () => {})
// emitted for any incoming nonza
client.on('nonza', () => {})

client.on('fragment', (output, input) => {
  console.log(output ? '=>' : '<=', output || input)
})

client.start('ws://localhost:5280/xmpp-websocket')
  .catch(err => {
    console.error(err)
  })

// FIXME doesn't work for some reason
client.on('open', (el) => {
  console.log('open', el.toString())
})

client.on('connect', () => {
  console.log('connect')
})

client.on('features', el => {
  console.log('features', el.toString())
})

client.on('authenticate', authenticate => {
  console.log('authentication')
  authenticate('node-xmpp', 'foobar')
    .then(() => {
      console.log('authenticated')
    })
    .catch(() => {
      console.error('authentication failed')
    })
})

client.on('authenticated', () => {
  console.log('authenticated')
})

client.on('online', (jid) => {
  console.log('online', jid.toString())
})
// client.start({uri: 'ws://localhost:5280/xmpp-websocket', username: 'sonny', password: 'foobar'})
//   .then(jid => {
//     console.log(client.jid.toString())
//     console.log(jid.toString())
//     return jid
//   })
//   .catch(err => {
//     console.log(err)
//   })


// client.getAltnernativeConnectionsMethods('localhost', (err, methods) => {
//   console.log(err || methods)
// })
