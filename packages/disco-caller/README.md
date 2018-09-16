# disco

[Service Discovery](https://xmpp.org/extensions/xep-0030.html) for `@xmpp/client` and `@xmpp/component`.

Supports Node.js and browsers.

## Install

```js
npm install @xmpp/plugins
```

## Caller

Both `jid` and `node` parameters are optionals

```js
const caller = client.plugin(require('@xmpp/plugins/disco/caller'))

// info
caller.info(jid, node).then(([features, identities]) => {
  /*
[
  // features
  [
    'jabber:iq:register',
    'urn:xmpp:ping',
    'http://jabber.org/protocol/disco#info',
    'http://jabber.org/protocol/disco#items',
    'msgoffline',
    'jabber:iq:roster'
  ],
  // identities
  [ { type: 'im', name: 'Prosody', category: 'server' } ]
]
*/
})

// items
caller.items(jid, node).then(items => {
  /*
[ { jid: 'component.localhost' }, { jid: 'anon.localhost' } ]
*/
})
```

## References

[XEP-0030: Service Discovery](https://xmpp.org/extensions/xep-0030.html)
