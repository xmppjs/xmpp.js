# JID

XMPP identifiers (JID) for JavaScript

| JID type | local |  @  |     domain     |  /  |  resource  |         usage          |
| :------: | :---: | :-: | :------------: | :-: | :--------: | :--------------------: |
|  domain  |       |     | wonderland.net |     |            | servers and components |
|   bare   | alice |  @  | wonderland.net |     |            |         users          |
|   full   | alice |  @  | wonderland.net |  /  | rabbithole | user resource (device) |

https://en.wikipedia.org/wiki/XMPP#Decentralization_and_addressing

## Install

`npm install @xmpp/jid` or `yarn add @xmpp/jid`

## Usage

```js
var jid = require('@xmpp/jid')

/*
 * All return an instance of jid.JID
 */
var addr = jid('alice@wonderland.net/rabbithole')
var addr = jid('alice', 'wonderland.net', 'rabbithole')

addr instanceof jid.JID // true

// domain JIDs are created passing the domain as the first argument
var addr = jid('wonderland.net')

/*
 * local
 */
addr.local = 'alice'
addr.local // alice
// same as
addr.setLocal('alice')
addr.getLocal() // alice

/*
 * domain
 */
addr.domain = 'wonderland.net'
addr.domain // wonderland.net
// same as
addr.setDomain('wonderland.net')
addr.getDomain() // wonderland.net

/*
 * resource
 */
addr.resource = 'rabbithole'
addr.resource // rabbithole
// same as
addr.setResource('rabbithole')
addr.getResource() // rabbithole

addr.toString() // alice@wonderland.net/rabbithole
addr.bare() // returns a JID without resource

addr.equals(some_jid) // returns true if the two JIDs are equal, false otherwise
// same as
jid.equal(addr, some_jid)
```

## Escaping

The [XEP-0106](http://xmpp.org/extensions/xep-0106.html) defines a method to escape and unescape characters that aren't allowed in the local part of the JID. This library fully implement it.

```js
const addr = jid('contact@example.net', 'xmpp.net')
addr.toString() // contact\40example.net@xmpp.net
// for display purpose only
addr.toString(true) // contact@example.net@xmpp.net
```

For user input, use

```js
jid('contact@example.net', 'xmpp.net')
// over
jid('contact@example.net@xmpp.net')
```

## References

- [RFC 7622 XMPP Address Format](https://tools.ietf.org/html/rfc7622) mostly implemented, l10n WIP
- [XEP-0106 JID Escaping](https://xmpp.org/extensions/xep-0106.html) implemented

### Deprecated

- [XEP-0029 Definition of Jabber Identifiers (JIDs)](https://xmpp.org/extensions/xep-0029.html) 2003
- [RFC 3920 XMPP addressing](https://tools.ietf.org/html/rfc3920#section-3) 2004
- [RFC 3920 XMPP Address Format](https://tools.ietf.org/html/rfc6122) 2011
