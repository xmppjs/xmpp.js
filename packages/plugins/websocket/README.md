# WebSocket

WebSocket transport for XMPP client

Included and enabled in `@xmpp/client`.

Supports Node.js and browsers.

## Install

```js
npm install @xmpp/plugins
```

## Usage

```js
client.plugin(require('@xmpp/plugins/websocket'))

client.start('ws://localhost:5280/xmpp-websocket')
```

## Advanced configuration

On Node.js [ws](https://github.com/websockets/ws) is used, if you wish to pass [advanced configuration](https://github.com/websockets/ws/blob/master/doc/ws.md#new-websocketaddress-protocols-options) you can do so.

```js
client.plugin(require('@xmpp/plugins/websocket'))

const options = {rejectUnauthorized: false}
client.start({
  uri: 'ws://localhost:5280/xmpp-websocket'
  transportParameters: options
})
```

## Alternative implementation

If you wish to use an alternative implementation with a WebSocket compatible API such as [sockjs](https://github.com/sockjs/sockjs-client) you can do so by passing a `socket` transport parameter.

```js
client.plugin(require('@xmpp/plugins/websocket'))

const options = {socket: ...}
client.start({
  uri: 'ws://localhost:5280/xmpp-websocket'
  transportParameters: options
})
```



## References

[RFC 7395 XMPP Subprotocol for WebSocket](https://tools.ietf.org/html/rfc7395)
