# WebSocket

WebSocket transport for `@xmpp/client`.

Included and enabled in `@xmpp/client`.

Supports Node.js and browsers.

## Install

```js
npm install @xmpp/websocket
```

## Usage

```js
require('@xmpp/websocket')(client)
client.start('ws://localhost:5280/xmpp-websocket')
```

## References

[RFC 7395 XMPP Subprotocol for WebSocket](https://tools.ietf.org/html/rfc7395)
