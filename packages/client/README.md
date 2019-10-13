# client

An XMPP client is an entity that connects to an XMPP server.

`@xmpp/client` package includes a minimal set of features to connect and authenticate securely and reliably.

It supports Node.js, browsers and React Native. See [below](#transports) for differences.

## Install

`npm install @xmpp/client @xmpp/debug` or `yarn add @xmpp/client @xmpp/debug`

## Setup

```js
const {client, xml, jid} = require('@xmpp/client')
```

or

```html
<script
  src="https://unpkg.com/@xmpp/client@VERSION/dist/xmpp.min.js"
  crossorigin
></script>
```

Replace `VERSION` with the desired version number.

```js
const {client, xml, jid} = window.XMPP
```

## Example

```js
const {client, xml} = require('@xmpp/client')

const xmpp = client({
  service: 'ws://localhost:5280/xmpp-websocket',
  domain: 'localhost',
  resource: 'example',
  username: 'username',
  password: 'password',
})

debug(xmpp, true)

xmpp.on('error', err => {
  console.error(err)
})

xmpp.on('offline', () => {
  console.log('offline')
})

xmpp.on('stanza', async stanza => {
  if (stanza.is('message')) {
    await xmpp.send(xml('presence', {type: 'unavailable'}))
    await xmpp.stop()
  }
})

xmpp.on('online', async address => {
  // Makes itself available
  await xmpp.send(xml('presence'))

  // Sends a chat message to itself
  const message = xml(
    'message',
    {type: 'chat', to: address},
    xml('body', {}, 'hello world')
  )
  await xmpp.send(message)
})

xmpp.start().catch(console.error)
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

### status

`online` indicates that `xmpp` is authenticated and addressable. It is emitted every time there is a successfull (re)connection.

`offline` indicates that `xmpp` disconnected and no automatic attempt to reconnect will happen (after calling `xmpp.stop()`).

Additional status:

- `connecting`: Socket is connecting
- `connect`: Socket is connected
- `opening`: Stream is opening
- `open`: Stream is open
- `closing`: Stream is closing
- `close`: Stream is closed
- `disconnecting`: Socket is disconnecting
- `disconnect`: Socket is disconnected

You can read the current status using the `status` property.

```js
const isOnline = xmpp.status === 'online'
```

You can listen for status change using the `status` event.

### Event `status`

Emitted when the status changes.

```js
xmpp.on('status', status => {
  console.debug(status)
})
```

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

Emitted when the connection is closed an no further attempt to reconnect will happen, after calling [xmpp.stop()](#xmpp.stop).

```js
xmpp.on('offline', () => {
  console.log('offline')
})
```

### start

Starts the connection. Attempts to reconnect will automatically happen if it cannot connect or gets disconnected.

```js
xmpp.start().catch(console.error)
xmpp.on('online', address => {
  console.log('online', address.toString())
})
```

Returns a promise that resolves if the first attempt succeed or rejects if the first attempt fails.

### stop

Stops the connection and prevent any further auto reconnect/retry.

```js
xmpp.stop().catch(console.error)
xmpp.on('offline', () => {
  console.log('offline')
})
```

Returns a promise that resolves once the stream closes and the socket disconnects.

### send

Sends a stanza.

```js
xmpp.send(xml('presence')).catch(console.error)
```

Returns a promise that resolves once the stanza is serialized and written to the socket or rejects if any of those fails.

### xmpp.reconnect

See [@xmpp/reconnect](/packages/reconnect).

## Transports

XMPP supports multiple transports, this table list `@xmpp/client` supported and unsupported transport for each environment.

|            transport             | protocols  | Node.js | Browser | React Native |
| :------------------------------: | :--------: | :-----: | :-----: | :----------: |
| [WebSocket](/packages/websocket) | `ws(s)://` |    ✔    |    ✔    |      ✔       |
|       [TCP](/packages/tcp)       | `xmpp://`  |    ✔    |    ✗    |      ✗       |
|       [TLS](/packages/tls)       | `xmpps://` |    ✔    |    ✗    |      ✗       |

## Authentication

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

## Common issues

<details>
  <summary><strong>Unable to resolve module</strong></summary>
  <p>If you are using an older React Native version, please require/import <code>@xmpp/client/reat-native</code> instead of <code>@xmpp/client</code>.</p>
</details>
