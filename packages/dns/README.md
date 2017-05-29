DNS
===

XMPP domain name resolution for JavaScript

## Install

```
npm install @xmpp/dns
```

## Usage

```javascript
const dns = require('@xmpp/dns')

dns.resolve('xmpp.org', {service: 'xmpp-client', protocol: 'tcp', family: null}).then((addresses) => {
  console.log(addresses)
})

[
  {
    address: '64.49.234.240',
    family: 4,
    name: 'xmpp.xmpp.org',
    port: 9222,
    priority: 1,
    weight: 1
  },
  {
    address: '2001:4800:7810:512:14e1:b81:ff05:8bb',
    family: 6,
    name: 'xmpp.xmpp.org',
    port: 9222,
    priority: 1,
    weight: 1
  },
  {
    address: '64.49.234.240',
    family: 4
  },
  {
    address: '2001:4800:7810:512:14e1:b81:ff05:8bb',
    family: 6
  }
]

```

## References

* [RFC 6120 Resolution of Fully Qualified Domain Names](https://xmpp.org/rfcs/rfc6120.html#tcp-resolution)
