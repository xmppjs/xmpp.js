# node-xmpp

idiomatic XMPP library for [node.js](http://nodejs.org/)


## Installation

With package manager [npm](http://npmjs.org/):

    npm install node-xmpp

Or, on Debian wheezy & sid:

    apt-get install libnode-node-xmpp

Thanks to Jonas Smedegaard!


## Motivation

You like [Strophe.js](http://strophe.im/strophejs/)? You bought a
copy of
[Professional XMPP Programming with JavaScript and jQuery](http://professionalxmpp.com/)?
You even want to use the same XMPP code for the web and node.js? Then
*you're wrong here:* go to [xmppjs](http://github.com/mwild1/xmppjs).

Objectives of *node-xmpp:*

* Use node.js conventions, especially `EventEmitter`, ie. for write
  buffer control
* Fast parsing, `node-expat` was written with this library in mind
* Client support for both XMPP clients and components
* Optional server infrastructure with `Router`
* After authentication, leave trivial protocol bits to the user (later
  we could offer helpers for entity capabilities hashing, etc)


## Features

* Client authentication with SASL DIGEST-MD5, PLAIN, ANONYMOUS, X-FACEBOOK-PLATFORM
* `_xmpp-client._tcp` SRV record support
* Simple JID parsing with Stringprep normalization
* XML builder & serialization
* xmlns-aware
* [Component](http://xmpp.org/extensions/xep-0114.html) connections
* Run your own server/talk to other servers with `xmpp.Router`


## Dependencies

* [node-expat](http://github.com/astro/node-expat)
* [ltx](http://github.com/astro/ltx)

Optional

* [node-stringprep](http://github.com/astro/node-stringprep): for [icu](http://icu-project.org/)-based string normalization.


## Related Libraries

* [node-xmpp-bosh](http://code.google.com/p/node-xmpp-bosh/): BOSH & websocket server (connection manager)
* [node-xmpp-via-bosh](https://github.com/anoopc/node-xmpp-via-bosh/): BOSH client connections from node.js
* [node-simple-xmpp](https://github.com/arunoda/node-simple-xmpp): Simpler high-level client layer


## Design

Inheritance tree and associations:

    ┌────────────┐1     1┌────────────┐
    │ net.Stream ├───────┤ Connection │
    └────────────┘       └────────────┘
                               ↑
          ┌────────────┬───────┴───┐
          │            │           │
    ┏━━━━━┷━━━━┓ ┏━━━━━┷━━━━━┓ ┌───┴────┐
    ┃  Client  ┃ ┃ Component ┃ │ Server │
    ┗━━━━━━━━━━┛ ┗━━━━━━━━━━━┛ └────────┘
                                   ↑
             ┌─────────────────────┤
             │                     │
    ┌────────┴───────┐ ┌───────────┴────┐
    │ OutgoingServer │ │ IncomingServer │
    └─────────────┬──┘ └───┬────────────┘
             0..* │        │ 0..*
          creates │        │ accepts
                 ┏┷━━━━━━━━┷┓
                 ┃  Router  ┃
                 ┗━━━━━━━━━━┛


This foundation is complemented by two basic data structures:

* *JID:* a Jabber-Id, represented as a triple of `user`, `domain`,
   `resource`
* *Element:* any XML Element

Desires about the API? Propose them ASAP!

### Building XML Elements

Strophe.js' XML Builder is very convenient for producing XMPP
stanzas. node-xmpp includes it in a much more primitive way: the
`c()`, `cnode()` and `t()` methods can be called on any *Element*
object, returning the new child element.

This can be confusing: in the end, you will hold the last-added child
until you use `up()`, a getter for the parent. `Connection.send()`
first invokes `tree()` to retrieve the uppermost parent, the XMPP
stanza, before sending it out the wire.


## TODO

* More documentation
* More tests (Using [Vows](http://vowsjs.org/))
