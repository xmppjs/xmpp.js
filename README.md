JID
===

[![Travis](https://img.shields.io/travis/node-xmpp/JID/master.svg?style=flat-square)](https://travis-ci.org/node-xmpp/JID/branches)

XMPP identifiers (JID) for JavaScript

alice   @ wonderland.net /  rabbithole

< local > @ <   domain   > / < resource >

# Usage

```javascript
var jid = new JID('alice', 'wonderland.net', 'rabbithole')
var jid = new JID('alice@wonderland.net/rabbithole')

jid.local      // alice
jid.getLocal() // alice
jid.setLocal('alice')

jid.domain      // wonderland.net
jid.getDomain() // wonderland.net
jid.setDomain('wonderland.net')

jid.resource      // rabbithole
jid.getResource() // rabbithole
jid.setResource('rabbithole')


// DEPRECATED! use local/getLocal/setLocal
jid.user      // alice
jid.getUser() // alice
jid.setUser('alice')
```

# References

* https://tools.ietf.org/html/rfc7622 (work in progress)
* http://xmpp.org/extensions/xep-0106.html (implemented)

# Deprecated

* http://xmpp.org/extensions/xep-0029.html (2003)
* https://tools.ietf.org/html/rfc3920#section-3 (2004)
* https://tools.ietf.org/html/rfc6122 (2011)
