/* eslint-disable node/no-extraneous-require */

'use strict'

const {component, xml} = require('@xmpp/component')

const xmpp = component({
  service: 'xmpp://localhost:5347',
  domain: 'component.localhost',
  password: 'mysecretcomponentpassword',
})

xmpp.on('error', err => {
  console.error('❌', err.toString())
})

xmpp.on('offline', () => {
  console.log('⏹', 'offline')
})

xmpp.on('stanza', async stanza => {
  if (stanza.is('message')) {
    await xmpp.stop()
  }
})

xmpp.on('online', async address => {
  console.log('▶', 'online as', address.toString())

  // Sends a chat message to itself
  const message = xml(
    'message',
    {type: 'chat', to: address},
    xml('body', 'hello world')
  )
  await xmpp.send(message)
})

// Debug
xmpp.on('status', status => {
  console.debug('🛈', 'status', status)
})
xmpp.on('input', input => {
  console.debug('⮈', input)
})
xmpp.on('output', output => {
  console.debug('⮊', output)
})

xmpp.start().catch(console.error)
