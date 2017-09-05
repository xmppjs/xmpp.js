# resolve

Auto resolve domain endpoints for `@xmpp/client-core`

Supports Node.js and browsers.

## Install

```js
npm install @xmpp/plugins
```

## Usage

```js
client.plugin(require('@xmpp/plugins/resolve'))
client.start('example.com')
```

resolve uses DNS records (Node.js only) and Web Host Metadata to automatically find a connection endpoint for a domain.

## References

* [RFC 6120 Resolution of Fully Qualified Domain Names](https://xmpp.org/rfcs/rfc6120.html#tcp-resolution)
* [XEP-0156: Discovering Alternative XMPP Connection Methods](https://xmpp.org/extensions/xep-0156.html)
* [XEP-0368: SRV records for XMPP over TLS](https://xmpp.org/extensions/xep-0368.html)
* [RFC 6415 Web Host Metadata](https://tools.ietf.org/html/rfc6415)
* [DNS configuration in Jabber/XMPP](https://prosody.im/doc/dns)
* [https://wiki.xmpp.org/web/SRV_Records](https://wiki.xmpp.org/web/SRV_Records)
