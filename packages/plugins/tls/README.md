# TLS

TLS transport for XMPP client

This establish a direct TLS connection without STARTTLS negotiation.

Included and enabled in `@xmpp/client`.

Supports Node.js.

## Install

```js
npm install @xmpp/plugins
```

## Usage

```js
client.plugin(require('@xmpp/plugins/tls'))
client.start('xmpps://example.com:5223')
```
