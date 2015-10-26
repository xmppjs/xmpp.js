# node-xmpp-server

Idiomatic XMPP server library for [Node.js](http://nodejs.org/)

[![build status](https://img.shields.io/travis/node-xmpp/node-xmpp-server/master.svg?style=flat-square)](https://travis-ci.org/node-xmpp/node-xmpp-server/branches)
[![Coverage Status](https://img.shields.io/coveralls/node-xmpp/node-xmpp-server.svg?style=flat-square)](https://coveralls.io/r/node-xmpp/node-xmpp-server)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square)](http://standardjs.com/)


## Manual

Please see http://node-xmpp.org/doc/server.html for instructions on how to use `node-xmpp-server`.

## Installation

__Note:__ We now only support nodejs versions 0.8.0 and greater.

With package manager [npm](http://npmjs.org/):

    npm install node-xmpp-server

### Testing

Install the dev dependencies, then...

```npm test```

Also see the tests run in [travis](http://travis-ci.org/node-xmpp/node-xmpp-server). The tests in travis run both the code and code style tests.

## How to use

Please see the various [examples](https://github.com/node-xmpp/node-xmpp-server/tree/master/examples).

## Objectives of *node-xmpp-server:*

* Use node.js conventions, especially `EventEmitter`, ie. for write
  buffer control
* Fast parsing, `node-expat` was written for this library
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
* Uses [ltx](http://github.com/node-xmpp/ltx)
  * Much easier to handle than a standard DOM
  * xmlns-aware
  * Easy XML builder like Strophe.js (see down)
  * Non-buffering serialization
  * Was split out of node-xmpp for modularization and resuability
* [Component](http://xmpp.org/extensions/xep-0114.html) connections
* Run your own server/talk to other servers with `xmpp.Router`
* [XMPP over WebSocket](http://tools.ietf.org/html/rfc7395)
* [XMPP over BOSH](http://xmpp.org/extensions/xep-0206.html)

## Dependencies

* [node-xmpp-core](http://github.com/node-xmpp/node-xmpp-core)

Optional

* [node-stringprep](http://github.com/node-xmpp/node-stringprep): for [icu](http://icu-project.org/)-based string normalization.

### Building XML Elements

Strophe.js' XML Builder is very convenient for producing XMPP
stanzas. ltx includes it in a much more primitive way: the
`c()`, `cnode()` and `t()` methods can be called on any *Element*
object, returning the new child element.

This can be confusing: in the end, you will hold the last-added child
until you use `up()`, a getter for the parent. `Connection.send()`
first invokes `tree()` to retrieve the uppermost parent, the XMPP
stanza, before sending it out the wire.

# Sponsors

 - [superfeedr](http://superfeedr.com/): S2S implementation
 - [Redbooth](https://redbooth.com/a/): BOSH fixes, WebSocket RFC 7395, maintenance

# Licence

MIT
