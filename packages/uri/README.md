# URI

XMPP URIs for JavaScript

Only parsing is supported at the moment.

## Install

```
npm install @xmpp/uri
```

## Usage

```javascript
const URI = require('@xmpp/uri')

URI.parse('xmpp://guest@example.com/support@example.com/truc?message;subject=Hello%20World')

{
  authority: jid('guest@example.com'), // see https://github.com/xmppjs/xmpp.js/tree/main/packages/jid
  path: jid('support@example.com/truc'), // see https://github.com/xmppjs/xmpp.js/tree/main/packages/jid
  query: {
    type: 'message',
    params: {
      subject: 'Hello World',
    },
  },
}
```

## References

- [RFC 5122 Internationalized Resource Identifiers (IRIs) and Uniform Resource Identifiers (URIs) for the Extensible Messaging and Presence Protocol (XMPP)](https://xmpp.org/rfcs/rfc5122.html)
- [XEP-0147: XMPP URI Scheme Query Components](https://xmpp.org/extensions/xep-0147.html)
- [XMPP URI/IRI Querytypes](https://xmpp.org/registrar/querytypes.html)
- https://wiki.xmpp.org/web/XMPP_URIs
