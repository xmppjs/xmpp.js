# component

Much like a client, a component is an entity that connects to an XMPP server.
However components are granted special permissions. If you'd like to extend an
XMPP server with additional features a component is a good choice.

See [XEP-0114: Jabber Component Protocol](https://xmpp.org/extensions/xep-0114.html) for details.

`@xmpp/component` package includes a minimal set of features to connect /authenticate securely and reliably.

## Install

`npm install @xmpp/component` or `yarn add @xmpp/component`

## Example

```js
const {component, xml, jid} = require('@xmpp/component')

const xmpp = component({
  service: 'xmpp://localhost:5347',
  domain: 'component.localhost',
  password: 'mysecretcomponentpassword',
})

xmpp.on('error', err => {
  console.error('❌', err.toString())
})

xmpp.on('offline', () => {
  console.log('🛈', 'offline')
})

xmpp.on('online', async address => {
  console.log('🗸', 'online as', address.toString())

  // Sends a chat message to itself
  const message = xml(
    'message',
    {type: 'chat', to: address},
    xml('body', 'hello world')
  )
  xmpp.send(message)
})

xmpp.on('stanza', stanza => {
  console.log('⮈', stanza.toString())
  xmpp.stop()
})

xmpp.start()
```

## xml

See [xml package](/packages/xml)

## jid

See [jid package](/packages/jid)

## component

- `options` <`Object`>

  - `service` `<string>` The service to connect to, accepts an URI. eg. `xmpp://localhost:5347`
  - `domain` `<string>` Domain of the component. eg. `component.localhost`
  - `password` `<string>` Password to use to authenticate with the service.

Returns an [xmpp](#xmpp) object.

## xmpp

`xmpp` is an instance of [EventEmitter](https://nodejs.org/api/events.html).

### Event `error`

Emitted when an error occurs. For connection errors, `xmpp` will reconnect on its own using [@xmpp/reconnect](/packages/reconnect) however a listener MUST be attached to avoid uncaught exceptions.

- `<Error>`

```js
xmpp.on('error', error => {
  console.error(error)
})
```

### Event `stanza`

Emitted when a stanza is received and parsed.

- [`<Element>`](/packages/xml)

```js
// Simple echo bot example
xmpp.on('stanza', stanza => {
  console.log(stanza.toString())
  if (!stanza.is('message')) return

  const message = stanza.clone()
  message.attrs.to = stanza.attrs.from
  xmpp.send(message)
})
```

### Event `online`

Emitted when connected, authenticated and ready to receive/send stanzas.

- [`<Jid>`](/packages/jid)

```js
xmpp.on('online', address => {
  console.log('online as', address.toString())
})
```

### Event `offline`

Emitted when the connection is closed an no further attempt to reconnect will happen, usually after [xmpp.stop()](#xmpp.stop).

```js
xmpp.on('offline', () => {
  console.log('offline')
})
```

### start

Starts the connection. Attempts to reconnect will automatically happen if disconnected.

```js
xmpp.start()
xmpp.on('online', address => {
  console.log('online', address.toString())
})
```

### stop

Stops the connection and prevent any further reconnect.

```js
xmpp.stop()
xmpp.on('offline', () => {
  console.log('offline')
})
```

### send

Sends a stanza.

```js
xmpp.send(xml('presence'))
```

### xmpp.reconnect

See [@xmpp/reconnect](/packages/reconnect).
