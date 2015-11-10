JID
===

[![Travis](https://img.shields.io/travis/node-xmpp/JID/master.svg?style=flat-square)](https://travis-ci.org/node-xmpp/JID/branches)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square)](http://standardjs.com/)

XMPP identifiers (JID) for JavaScript

alice   @ wonderland.net /  rabbithole

< local > @ <   domain   > / < resource >

# Usage

```javascript
var jid = 'alice' + '@' + 'wonderland.net' + '/' + 'rabbithole' // BAD !
var jid = new JID('alice@wonderland.net/rabbithole')            // OK
var jid = new JID('alice', 'wonderland.net', 'rabbithole')      // BEST; see section on escaping below

jid.local = 'alice'
jid.local      // alice
jid.setLocal('alice')
jid.getLocal() // alice

jid.domain = 'wonderland.net'
jid.domain      // wonderland.net
jid.setDomain('wonderland.net')
jid.getDomain() // wonderland.net

jid.resource = 'rabbithole'
jid.resource      // rabbithole
jid.setResource('rabbithole')
jid.getResource() // rabbithole

jid.toString() // alice@wonderland.net/rabbithole

// DEPRECATED! use local/getLocal/setLocal
jid.user      // alice
jid.getUser() // alice
jid.setUser('alice')
```

# Escaping

The [XEP-0106](http://xmpp.org/extensions/xep-0106.html) defines a method to escape and unescape characters that aren't allowed in the local part of the JID. This library fully implement it but because `@` and `/` are ones of them and used as JID separators, you should always prefer the following syntax

```javascript
// GOOD
new JID(local, domain, resource)
```

over

```javascript
// BAD
new JID(local@domain/resource)
```

for user input.

# References

* https://tools.ietf.org/html/rfc7622 (work in progress)
* http://xmpp.org/extensions/xep-0106.html (implemented)

## Deprecated

* http://xmpp.org/extensions/xep-0029.html (2003)
* https://tools.ietf.org/html/rfc3920#section-3 (2004)
* https://tools.ietf.org/html/rfc6122 (2011)
