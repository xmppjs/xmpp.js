# TLS

TLS transport for `@xmpp/client`.

Included and enabled in `@xmpp/client`.

This establish a direct TLS connection without STARTTLS negotiation.

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
