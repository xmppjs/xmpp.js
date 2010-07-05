# node-xmpp

idiomatic XMPP library for [node.js](http://nodejs.org/)


## Installation with [npm](http://github.com/isaacs/npm)

    npm install node-expat


## Motivation

You like [Strophe.js](http://code.stanziq.com/strophe/)? You bought a
copy of
[Professional XMPP Programming with JavaScript and jQuery](http://professionalxmpp.com/)?
You even want to use the same XMPP code for the web and node.js? Then
*you're wrong here:* go to [xmppjs](http://github.com/mwild1/xmppjs).

Objectives of *node-xmpp:*

* Use node.js conventions, especially `EventEmitter`, ie. for write
  buffer control
* Fast parsing, `node-expat` was written with this library in mind
* Support for both XMPP clients and components
* After authentication, leave trivial protocol bits to the user (later
  we could offer helpers for entity capabilities hashing, etc)


## Features

* Client authentication with SASL DIGEST-MD5, PLAIN, ANONYMOUS
* `_xmpp-client._tcp` SRV record support
* Simple JID parsing
* XML builder & serialization, xmlns-aware
* [Component](http://xmpp.org/extensions/xep-0114.html) connections


## Dependencies

* [node-base64](http://github.com/brainfucker/node-base64)
* [node-expat](http://github.com/astro/node-expat)


## Design

          ┌────────────┐
          │ net.Stream │
          └─────┬──────┘
                │
          ┌─────┴──────┐
          │ Connection │
          └─────┬──────┘
                │
          ┌─────┴──────┐
          │            │
    ┏━━━━━┷━━━━┓ ┏━━━━━┷━━━━━┓
    ┃  Client  ┃ ┃ Component ┃
    ┗━━━━━━━━━━┛ ┗━━━━━━━━━━━┛

That means you can use the TCP events of `net.Stream` with Client and
Component objects. Other than that, hook callbacks to these events:

* `authFail`, distinguished from `error`
* `online`, when authentication is done and you can send XMPP stanzas
  (ie. `<presence/>`)
* `stanza` for each incoming XMPP stanza, with the XML Element as
  parameter
* `error` with the `<stream:error/>` as parameter

This foundation is complemented by two basic data structures:

* *JID:* a Jabber-Id, represented as a triple of `user`, `domain`,
   `resource`
* *Element:* any XML Element

Desires about the API? Propose them ASAP!

### Building XML Elements

strophejs' XML Builder is very convenient for producing XMPP
stanzas. node-xmpp includes it in a much more primitive way: the
`c()`, `cnode()` and `t()` methods can be called on any *Element*
object, returning the new child element.

This can be confusing: in the end, you will hold the last-added child
until you use `up()`, a getter for the parent. `Connection.send()`
first invokes `tree()` to retrieve the uppermost parent, the XMPP
stanza, before sending it out the wire.


## TODO

* Documentation
* Tests ([what framework?](http://wiki.github.com/ry/node/modules#testing))
* Avoid namespace pollution?
