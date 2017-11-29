# ping

[ping](https://xmpp.org/extensions/xep-0199.html) for `@xmpp/client` and `@xmpp/component`.

Supports Node.js and browsers.

## Install

```js
npm install @xmpp/plugins
```

## Callee

ping callee makes the entity automatically reply to ping queries

```js
client.plugin(require('@xmpp/plugins/ping/callee'))
```

## Caller

Send pings to other entities.

```js
const caller = client.plugin(require('@xmpp/plugins/ping/caller'))

// jid is optional
caller.ping(jid).then(() => {
  console.log('pong')
})
```

## References

[XEP-0199: XMPP Ping](https://xmpp.org/extensions/xep-0199.html)
