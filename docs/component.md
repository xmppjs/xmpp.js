# component

Much like a client, a component is an entity that connects to an XMPP server. However components are granted special permissions. If you'd like to extend an XMPP server with additional features a component is a good choice.

[component](/packages/component) package includes component-core and ships with most commonly used plugins. This is the recommended package for newcomers.

[component-core](/packages/component-core) package provides a bare component connection and allows to hand-pick plugins. It is recommend to start with the `component` package and switch to this once you feel comfortable with `xmpp.js`.

They both provide the same API so making the switch is pretty easy.

Here is a code example with `component` package to get started.

```js
const {Component} = require('@xmpp/component')

const component = new Component()

component.start({
  uri: 'xmpp://localhost:5347',
  domain: 'component.localhost'
})

component.on('error', err => {
  console.error('❌', err.toString())
})

component.on('status', (status, value) => {
  console.log('🛈', status, value ? value.toString() : '')
})

component.on('online', jid => {
  console.log('🗸', 'online as', jid.toString())
})

component.on('stanza', stanza => {
  console.log('⮈', stanza.toString())
})

component.handle('authenticate', authenticate => {
  return authenticate('mysecretcomponentpassword')
})
```
