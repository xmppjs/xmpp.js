# node-xmpp-server

Idiomatic XMPP server library for [Node.js](http://nodejs.org/)

[![build status](https://img.shields.io/travis/node-xmpp/server/master.svg?style=flat-square)](https://travis-ci.org/node-xmpp/node-xmpp-server/branches)
[![Coverage Status](https://img.shields.io/coveralls/node-xmpp/server.svg?style=flat-square)](https://coveralls.io/r/node-xmpp/node-xmpp-server)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square)](http://standardjs.com/)


## Manual

Please see http://node-xmpp.org/doc/server.html for instructions on how to use `node-xmpp-server`.

## Install

```
npm install node-xmpp-server
```

### Test

```
npm install -g mocha standard
npm test
```

## How to use

Please see the various [examples](https://github.com/node-xmpp/node-xmpp-server/tree/master/examples).

## Features

* Client authentication with SASL DIGEST-MD5, PLAIN, ANONYMOUS, X-FACEBOOK-PLATFORM
* `_xmpp-client._tcp` SRV record support
* JID parsing
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

## Sponsors

 - [superfeedr](http://superfeedr.com): S2S implementation
 - [Redbooth](https://redbooth.com): BOSH fixes, WebSocket RFC 7395, maintenance

## Licence

MIT
