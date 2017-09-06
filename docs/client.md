# client

An XMPP client is an entity that connects to an XMPP server. `xmpp.js` provides 2 different packages to create an XMPP client.

`@xmpp/client` package includes client-core and ships with most commonly used plugins. This is the recommended package for newcomers or generic XMPP clients.

`@xmpp/client-core` package provides a bare client connection and allows to hand-pick plugins. It is specially useful in the browser to save bytes from the bundle. It is recommend to start with the `@xmpp/client` package and switch to this once you feel comfortable with `xmpp.js`.

They both provide the same API so making the switch is pretty easy.

Here is a code example to get started.

```js
const {Client} = require('@xmpp/client')

const client = new Client()

client.start('ws://localhost:5280/xmpp-websocket')

client.on('error', err => {
  console.error('❌', err.toString())
})

client.on('status', (status, value) => {
  console.log('🛈', status, value ? value.toString() : '')
})

client.on('online', jid => {
  console.log('🗸', 'online as', jid.toString())
})

client.on('stanza', stanza => {
  console.log('⮈', stanza.toString())
})

client.handle('authenticate', authenticate => {
  return authenticate('username', 'password')
})
```
