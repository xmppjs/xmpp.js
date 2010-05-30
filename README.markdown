# node-xmpp

idiomatic XMPP library for [node.js](http://nodejs.org/)


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
Component objects.

Desires about the API? Propose them ASAP!


## TODO

* Documentation
* Tests ([what framework?](http://wiki.github.com/ry/node/modules#testing))
* Support `SASL DIGEST-MD5` authentication
* Component support (that's trivial)
