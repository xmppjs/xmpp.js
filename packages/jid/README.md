JID
===

XMPP identifiers (JID) for JavaScript

| JID type | local | @ |     domain     | / |  resource  |          usage         |
|:--------:|:-----:|:-:|:--------------:|:-:|:----------:|:----------------------:|
|  domain  |       |   | wonderland.net |   |            | servers and components |
|   bare   | alice | @ | wonderland.net |   |            | users                  |
|   full   | alice | @ | wonderland.net | / | rabbithole | user resource (device) |

https://en.wikipedia.org/wiki/XMPP#Decentralization_and_addressing

## Install

```
npm install @xmpp/jid
```

## Usage

```javascript
var JID = require('@xmpp/jid')

/*
 * All return an instance of JID.JID, the new operator is optional.
 */
var addr = new JID('alice@wonderland.net/rabbithole')          // OK
var addr = JID`${'alice'}@${'wonderland.net'}/${'rabbithole'}` // OK, es6 tagged template string
var addr = new JID('alice', 'wonderland.net', 'rabbithole')    // BEST; see section on escaping below

addr instanceof JID.JID // true

// domain JIDs are created passing the domain as the first argument
var addr = JID('wonderland.net')

/*
 * local
 */
addr.local = 'alice'
addr.local      // alice
// same as
addr.setLocal('alice')
addr.getLocal() // alice

/*
 * domain
 */
addr.domain = 'wonderland.net'
addr.domain      // wonderland.net
// same as
addr.setDomain('wonderland.net')
addr.getDomain() // wonderland.net

/*
 * resource
 */
addr.resource = 'rabbithole'
addr.resource      // rabbithole
// same as
addr.setResource('rabbithole')
addr.getResource() // rabbithole

addr.toString() // alice@wonderland.net/rabbithole
addr.bare()     // returns a JID without resource

addr.equals(some_jid) // returns true if the two JIDs are equal, false otherwise
// same as
JID.equal(addr, some_jid)

JID.is(addr) // returns true if the passed argument is an instance of JID.JID, false otherwise
```

## Escaping

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

## References

* [RFC 7622 XMPP Address Format](https://tools.ietf.org/html/rfc7622) mostly implemented, l10n WIP
* [XEP-0106 JID Escaping](https://xmpp.org/extensions/xep-0106.html) implemented

### Deprecated

* [XEP-0029 Definition of Jabber Identifiers (JIDs)](https://xmpp.org/extensions/xep-0029.html) 2003
* [RFC 3920 XMPP addressing](https://tools.ietf.org/html/rfc3920#section-3) 2004
* [RFC 3920 XMPP Address Format](https://tools.ietf.org/html/rfc6122) 2011
