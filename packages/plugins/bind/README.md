# bind

Resource binding for `@xmpp/client-core`.

Included and enabled in `@xmpp/client`.

Supports Node.js and browsers.

## Install

```js
npm install @xmpp/plugins
```

## Usage

```js
client.plugin(require('@xmpp/plugins/bind'))
```

By default it'll let the server generated the resource but you can choose your own.

```js
client.handle('bind', (bind) => {
  return bind('resource')
})
```

## References

[RFC 6120 Resource Binding](https://xmpp.org/rfcs/rfc6120.html#bind)
