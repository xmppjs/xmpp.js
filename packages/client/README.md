# client

An XMPP client is an entity that connects to an XMPP server.

`@xmpp/client` package includes a minimal set of features to connect and authenticate securely and reliably.

It supports Node.js, browser and React Native. See [Connection Method](#connection-methods) for differences.

## Install

`npm install @xmpp/client` or `yarn add @xmpp/client`

## Setup

```js
const {client, xml, jid} = require('@xmpp/client')
```

or

```html
<script src="https://unpkg.com/@xmpp/client/dist/xmpp.min.js" crossorigin></script>
```

```js
const {client, xml, jid} = window.XMPP
```

## Example

```js
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

## client

- `options` <`Object`>

  - `service` `<string>` The service to connect to, accepts an URI or a domain.
    - `domain` lookup and connect to the most secure endpoint using [@xmpp/resolve](/packages/resolve)
    - `xmpp://hostname:port` plain TCP, may be upgraded to TLS by [@xmpp/starttls](/packages/starttls)
    - `xmpps://hostname:port` direct TLS
    - `ws://hostname:port/path` plain WebSocket
    - `wss://hostname:port/path` secure WebSocket
  - `domain` `<string>` Optional domain of the service, if omitted will use the hostname from `service`. Useful when the service domain is different than the service hostname.
  - `resource` `<string`> Optional resource for [resource binding](/packages/resource-binding)
  - `username` `<string>` Optional username for [sasl](/packages/sasl)
  - `password` `<string>` Optional password for [sasl](/packages/sasl)

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

## Connection methods

XMPP supports multiple transports, this table list `@xmpp/client` supported and unsupported transport for each environment.

|            transport             |   protocols   | Node.js | Browser | React Native |
| :------------------------------: | :-----------: | :-----: | :-----: | :----------: |
| [WebSocket](/packages/websocket) | ws://, wss:// |    ✔    |    ✔    |      ✔       |
|       [TCP](/packages/tcp)       |    xmpp://    |    ✔    |    ✗    |      ✗       |
|       [TLS](/packages/tls)       |   xmpps://    |    ✔    |    ✗    |      ✗       |

## Authentication methods

Multiple authentication mechanisms are supported.
PLAIN should only be used over secure WebSocket (`wss://)`, direct TLS (`xmpps:`) or a TCP (`xmpp:`) connection upgraded to TLS via [STARTTLS](/starttls)

|                   SASL                    | Node.js | Browser | React Native |
| :---------------------------------------: | :-----: | :-----: | :----------: |
|   [ANONYMOUS](/packages/sasl-anonymous)   |    ✔    |    ✔    |      ✔       |
|       [PLAIN](/packages/sasl-plain)       |    ✔    |    ✔    |      ✔       |
| [SCRAM-SHA-1](/packages/sasl-scram-sha-1) |    ✔    |    ☐    |      ✗       |

- ☐ : Optional
- ✗ : Unavailable
- ✔ : Included
