/* eslint-disable */

'use strict'

const Component = require('./packages/component').default
const client = new Component()

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

const password = 'foobar'

client.on('fragment', (output, input) => {
  console.log(output ? '=>' : '<=', output || input)
})

client.start('xmpp:component.localhost:5269')
  .then(() => client.open('component.localhost'))
  .then(() => client.authenticate(password))
  .then((jid) => {
    console.log(jid.toString())
    console.log(client.jid.toString())
  })
  .catch(err => {
    console.log(err)
  })
