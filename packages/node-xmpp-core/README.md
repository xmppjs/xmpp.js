# node-xmpp-core

Library to handle all the core functionality for:

* [node-xmpp-client](https://github.com/node-xmpp/node-xmpp-client)
* [node-xmpp-component](https://github.com/node-xmpp/node-xmpp-component)
* [node-xmpp-server](https://github.com/node-xmpp/node-xmpp-server)

[![build status](https://img.shields.io/travis/node-xmpp/node-xmpp-core/master.svg?style=flat-square)](http://travis-ci.org/node-xmpp/node-xmpp-core)
[![Coverage Status](https://img.shields.io/coveralls/node-xmpp/node-xmpp-core.svg?style=flat-square)](https://coveralls.io/r/node-xmpp/node-xmpp-core)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square)](http://standardjs.com/)

## Installation

__Note:__ We now only support Node.js versions 0.8.0 and greater.

With package manager [npm](http://npmjs.org/):

    npm install node-xmpp-core

### Testing

Install the dev dependencies, then...

```
npm test
```

Also see the tests run in [travis](http://travis-ci.org/node-xmpp/node-xmpp-core). The tests in travis run both the code and code style tests.

## How to use

Please use one of `node-xmpp-client/component/server`

## Objectives of *node-xmpp-core:*

* Use node.js conventions, especially `EventEmitter`, ie. for write
  buffer control
* Fast parsing, `node-expat` was written for this library

## Configurations

### serialized
Set this option as `true` to enable the optimization for continuous TCP streams. If your "socket" actually transports frames (WebSockets) and you can't have stanzas split across those, do not enable it.

**type:** boolean
**default:** `false`


## Features

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

## Dependencies

* [ltx](http://github.com/node-xmpp/ltx)

Optional

* [node-stringprep](http://github.com/node-xmpp/node-stringprep): for [icu](http://icu-project.org/)-based string normalization.

Automatically building the optional library can be turned off by `npm config set optional false` or by setting the environmental variable `export NPM_CONFIG_OPTIONAL=false`. On Heroku this is done through `heroku config:set NPM_CONFIG_OPTIONAL=false`, for example.

### Building XML Elements

Strophe.js' XML Builder is very convenient for producing XMPP
stanzas. ltx includes it in a much more primitive way: the
`c()`, `cnode()` and `t()` methods can be called on any *Element*
object, returning the new child element.

This can be confusing: in the end, you will hold the last-added child
until you use `up()`, a getter for the parent. `Connection.send()`
first invokes `tree()` to retrieve the uppermost parent, the XMPP
stanza, before sending it out the wire.

# Documentation

(Builing up documentation slowly)

## JID Manipulation

...coming soon...
