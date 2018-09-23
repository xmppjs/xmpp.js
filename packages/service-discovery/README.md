# disco

[Service Discovery](https://xmpp.org/extensions/xep-0030.html) for `@xmpp/client` and `@xmpp/component`.

Supports Node.js and browsers.

## Install

```
npm install @xmpp/service-discovery
```

## Caller

Disco caller allows the entity to query service discovery requests.

### Usage

```js
const {xmpp} = require('@xmpp/client')
const {client, iqCaller} = xmpp(...)
const caller = require('@xmpp/service-discovery/caller')({iqCaller})
```

### info

Both `jid` and `node` parameters are optionals.

```js
const {features, identities} = await caller.info(jid, node)

// features
// [
//   'jabber:iq:register',
//   'urn:xmpp:ping',
//   'http://jabber.org/protocol/disco#info',
//   'http://jabber.org/protocol/disco#items',
//   'msgoffline',
// ]

// identities
// { type: 'im', name: 'Prosody', category: 'server' }
```

### items

Both `jid` and `node` parameters are optionals.

```js
const items = await caller.items(jid, node)

// items
// [ { jid: 'component.localhost' }, { jid: 'anon.localhost' } ]
```

## Callee

Disco callee allows the entity to reply to service discovery queries.

### Usage

```js
const {xmpp} = require('@xmpp/client')
const {client, iqCallee} = xmpp(...)
const callee = require('@xmpp/service-discovery/callee')({iqCallee})

// add a feature
callee.features.add('jabber:iq:time')
// add an identity
callee.identity.add({name: 'xmpp.js', type: 'pc', category: 'client'})
```

The entity will automatically reply to disco info queries.

## References

[XEP-0030: Service Discovery](https://xmpp.org/extensions/xep-0030.html)
