# node-xmpp-component

XMPP component for Node.js

[![build status](https://img.shields.io/travis/node-xmpp/component/master.svg?style=flat-square)](https://travis-ci.org/node-xmpp/component/branches)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square)](http://standardjs.com/)

## Manual

Please see http://node-xmpp.org/doc/component.html for instructions on how to use `node-xmpp-component`.

## Installation

__Note:__ We now only support nodejs versions 0.8.0 and greater.

With package manager [npm](http://npmjs.org/):

    npm install node-xmpp-component

### Testing

Install the dev dependencies, then...

```
npm test
```

Also see the tests run in [travis](http://travis-ci.org/node-xmpp/node-xmpp-component). The tests in travis run both the code and code style tests.

#### Integration tests

There are also a small number of integration tests designed to be run against [Prosody](http://prosody.im). To run these ensure the user the test is run as has sudo access. Copy the prosody configuration file from ```test/resources/prosody.cfg.lua``` to ```/etc/prosody/prosody.cfg.lua```.

## How to use

Please see the various [examples](https://github.com/node-xmpp/node-xmpp/tree/master/packages/node-xmpp-component/examples).

## Objectives of *node-xmpp:*

* Use node.js conventions, especially `EventEmitter`, ie. for write
  buffer control
* Client support for both XMPP clients and components

## Features

* [Component](http://xmpp.org/extensions/xep-0114.html) connections

## Dependencies

* [node-xmpp-core](http://github.com/node-xmpp/node-xmpp-core)
