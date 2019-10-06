/* eslint-disable node/no-extraneous-require */

'use strict'

const {client, xml} = require('@xmpp/client')

const xmpp = client({
  service: 'ws://localhost:5280/xmpp-websocket',
  domain: 'localhost',
  resource: 'example',
  username: 'username',
  password: 'password',
})

xmpp.on('error', err => {
  console.error('❌', err.toString())
})

xmpp.on('offline', () => {
  console.log('⏹', 'offline')
})

xmpp.on('stanza', async stanza => {
  if (stanza.is('message')) {
    await xmpp.send(xml('presence', {type: 'unavailable'}))
    await xmpp.stop()
  }
})

xmpp.on('online', async address => {
  console.log('▶', 'online as', address.toString())

  // Makes itself available
  await xmpp.send(xml('presence'))

  // Sends a chat message to itself
  const message = xml(
    'message',
    {type: 'chat', to: address},
    xml('body', null, 'hello world')
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
