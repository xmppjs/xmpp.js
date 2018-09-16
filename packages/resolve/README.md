# resolve

XMPP connection methods resolution for JavaScript

`@xmpp/resolve` retrieves and sorts possible XMPP endpoints using DNS and HTTP Web Host Metadata.

## Install

```
npm install @xmpp/resolve
```

## Usage

```javascript
const resolve = require('@xmpp/resolve')

// optional
const options = {
  srv: [{service: 'xmpp-client', protocol: 'tcp'}], // SRV records
  family: undefined, // IP version; 4, 6 or undefined for both
  owner: '_xmppconnect', // TXT owner
}

resolve('xmppjs.org', options)
  .then(console.log)
  .catch(console.error)
```

```javascript
;[
  {
    address: '93.113.206.189',
    family: 4,
    name: 'xmppjs.org',
    port: 5222,
    priority: 5,
    weight: 0,
  },
  {
    address: '2a03:75c0:39:3458::1',
    family: 6,
    name: 'xmppjs.org',
    port: 5222,
    priority: 5,
    weight: 0,
  },
  {address: '93.113.206.189', family: 4},
  {address: '2a03:75c0:39:3458::1', family: 6},
  {
    attribute: '_xmpp-client-websocket',
    uri: 'wss://xmppjs.org:443/websocket',
  },
  {
    attribute: '_xmpp-client-xbosh',
    uri: 'https://xmppjs.org:443/bosh',
  },
]
```

## References

- [RFC 6120 Resolution of Fully Qualified Domain Names](https://xmpp.org/rfcs/rfc6120.html#tcp-resolution)
- [XEP-0156: Discovering Alternative XMPP Connection Methods](https://xmpp.org/extensions/xep-0156.html)
- [XEP-0368: SRV records for XMPP over TLS](https://xmpp.org/extensions/xep-0368.html)
- [RFC 6415 Web Host Metadata](https://tools.ietf.org/html/rfc6415)
- [DNS configuration in Jabber/XMPP](https://prosody.im/doc/dns)
- [https://wiki.xmpp.org/web/SRV_Records](https://wiki.xmpp.org/web/SRV_Records)
