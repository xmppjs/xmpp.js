# node-xmpp

Idiomatic XMPP component library for [node.js](http://nodejs.org/)

[![build status](https://secure.travis-ci.org/node-xmpp/node-xmpp-component.png)](http://travis-ci.org/node-xmpp/node-xmpp-component)

## Manual

Please see http://node-xmpp.github.io/doc/nodexmppcomponent.html for instructions on how to use `node-xmpp-component`.

## Installation

__Note:__ We now only support nodejs versions 0.8.0 and greater.

With package manager [npm](http://npmjs.org/):

    npm install node-xmpp-component

### Testing

Install the dev dependencies, then...

```npm test```

To run the tests and the code style checks then use:

```grunt test```

Also see the tests run in [travis](http://travis-ci.org/node-xmpp/node-xmpp-component). The tests in travis run both the code and code style tests.

#### Integration tests

There are also a small number of integration tests designed to be run against [Prosody](http://prosody.im). To run these ensure the user the test is run as has sudo access. Copy the prosody configuration file from ```test/resources/prosody.cfg.lua``` to ```/etc/prosody/prosody.cfg.lua```.

## How to use

Please see the various [examples](https://github.com/node-xmpp/node-xmpp/tree/master/examples).

## Objectives of *node-xmpp:*

* Use node.js conventions, especially `EventEmitter`, ie. for write
  buffer control
* Client support for both XMPP clients and components

## Features

* [Component](http://xmpp.org/extensions/xep-0114.html) connections

## Dependencies

* [node-xmpp-core](http://github.com/node-xmpp/node-xmpp-core)

Optional

* [node-stringprep](http://github.com/node-xmpp/node-stringprep): for [icu](http://icu-project.org/)-based string normalization.
