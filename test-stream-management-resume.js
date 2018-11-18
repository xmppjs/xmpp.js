/* eslint-disable no-console,node/no-extraneous-require */

/*
  This example reproduces an issue with prosody, mod_websocket and mod_smacks
  where a second disconnect (websocket opcode 8) sent by the client (after resuming the stream)
  doesn't close the socket on the server side until a 30 seconds timeout

  git clone -b stream-management-prosody-bug git@github.com:xmppjs/xmpp.js.git
  cd xmpp.js
  make
  make start # start prosody
  node test-stream-management-resume.js # reproduce the bug
*/

'use strict'

const {client} = require('@xmpp/client')
const {delay} = require('@xmpp/events')

const xmpp = client({
  service: 'ws://localhost:5280/xmpp-websocket', // Cannot reproduce with xmpp://localhost:5222
  domain: 'localhost',
  resource: 'example',
  username: 'client',
  password: 'foobar',
})

xmpp.on('error', err => {
  console.error('❌', err.toString())
})

xmpp.on('offline', () => {
  console.log('🛈', 'offline')
})

xmpp.on('online', async address => {
  console.log('🗸', 'online as', address.toString())

  await delay(5000)

  console.time('first disconnect')

  await xmpp.disconnect()

  console.timeEnd('first disconnect') // ~2.713ms

  await delay(5000)

  console.time('second disconnect')

  await xmpp.disconnect(60000)

  console.timeEnd('second disconnect') // ~30011.714ms
})

// Debug
xmpp.on('status', status => {
  console.debug('🛈', status)
})
xmpp.on('input', input => {
  console.debug('⮈', input)
})
xmpp.on('output', output => {
  console.debug('⮊', output)
})

xmpp.start()
