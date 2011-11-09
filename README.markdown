# node-xmpp

idiomatic XMPP library for [node.js](http://nodejs.org/)


## Installation

With package manager [npm](http://npmjs.org/):

    npm install node-xmpp


## Objectives of *node-xmpp:*

* Use node.js conventions, especially `EventEmitter`, ie. for write
  buffer control
* Fast parsing, `node-expat` was written for this library
* Client support for both XMPP clients and components
* Optional server infrastructure with `Router`
* After authentication, leave trivial protocol bits to the user, that
  is XML handling according to any
  [XEP](http://xmpp.org/xmpp-protocols/xmpp-extensions/)


## Features

* Client authentication with SASL DIGEST-MD5, PLAIN, ANONYMOUS, X-FACEBOOK-PLATFORM
* `_xmpp-client._tcp` SRV record support
* Simple JID parsing with Stringprep normalization
  * Optional now, you won't need ICU for just node-xmpp
  * Please be aware if you identify users by JIDs
  * `npm install node-stringprep`
* Uses [ltx](http://github.com/astro/ltx)
  * Much easier to handle than a standard DOM
  * xmlns-aware
  * Easy XML builder like Strophe.js (see down)
  * Non-buffering serialization
  * Was split out of node-xmpp for modularization and resuability
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
* [node-simple-xmpp](https://github.com/arunoda/node-simple-xmpp/): Simpler high-level client layer
* [xmpp-server](https://github.com/superfeedr/xmpp-server/): Reusable XMPP server on top of node-xmpp


## Design

Inheritance tree and associations:

    ┌────────────┐1     1┌────────────┐
    │ net.Stream ├───────┤ Connection │
    └────────────┘       └────────────┘
                               ↑
          ┌────────────┬───────┴───┬────────────┐
          │            │           │            │
    ┏━━━━━┷━━━━┓ ┏━━━━━┷━━━━━┓ ┌───┴────┐ ┌─────┴─────┐
    ┃  Client  ┃ ┃ Component ┃ │ Server │ │ C2SStream │
    ┗━━━━━━━━━━┛ ┗━━━━━━━━━━━┛ └────────┘ └───────────┘
                                   ↑            ↑0..*
             ┌─────────────────────┤            │accepts
             │                     │            │1
    ┌────────┴───────┐ ┌───────────┴────┐ ┏━━━━━┷━━━━━┓
    │ OutgoingServer │ │ IncomingServer │ ┃ C2SServer ┃
    └─────────────┬──┘ └───┬────────────┘ ┗━━━━━┯━━━━━┛
             0..* │        │ 0..*               │
          creates │        │ accepts            │
                 ┏┷━━━━━━━━┷┓                   │
                 ┃  Router  ┃←──────────────────┘
                 ┗━━━━━━━━━━┛ 1


This foundation is complemented by two basic data structures:

* *JID:* a Jabber-Id, represented as a triple of `user`, `domain`,
   `resource`
* *Element:* any XML Element


### Building XML Elements

Strophe.js' XML Builder is very convenient for producing XMPP
stanzas. ltx includes it in a much more primitive way: the
`c()`, `cnode()` and `t()` methods can be called on any *Element*
object, returning the new child element.

This can be confusing: in the end, you will hold the last-added child
until you use `up()`, a getter for the parent. `Connection.send()`
first invokes `tree()` to retrieve the uppermost parent, the XMPP
stanza, before sending it out the wire.


## TODO

* More documentation
* More tests (Using [Vows](http://vowsjs.org/))
