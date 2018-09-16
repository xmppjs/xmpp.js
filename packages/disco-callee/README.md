# disco

[Service Discovery](https://xmpp.org/extensions/xep-0030.html) for `@xmpp/client` and `@xmpp/component`.

Supports Node.js and browsers.

## Install

```js
npm install @xmpp/plugins
```

## Callee

Disco callee allows the entity to reply to service discovery queries.

```js
const callee = client.plugin(require('@xmpp/plugins/disco/callee'))
// add a feature
callee.features.add('jabber:iq:time')
// add an identity
callee.identity.add({name: 'xmpp.js', type: 'pc', category: 'client'})
```

The entity will automatically reply to disco info queries.

## References

[XEP-0030: Service Discovery](https://xmpp.org/extensions/xep-0030.html)
