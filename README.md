# node-xmpp-client

XMPP client for JavaScript.

[![build status](https://img.shields.io/travis/node-xmpp/node-xmpp-client/master.svg)](https://travis-ci.org/node-xmpp/node-xmpp-client/branches)
[![Coverage Status](https://img.shields.io/coveralls/node-xmpp/node-xmpp-client.svg?style=flat-square)](https://coveralls.io/r/node-xmpp/node-xmpp-client)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square)](http://standardjs.com/)


## Manual

See http://node-xmpp.org/doc/client.html for instructions on how to use `node-xmpp-client`.

## Installation

__Note:__ We now only support nodejs versions 0.10.0 and greater.

With package manager [npm](http://npmjs.org/):

    npm install node-xmpp-client

### Testing

Install the dev dependencies, then...

```npm test```

To run the tests and the code style checks then use:

```grunt test```

Also see the tests run in [travis](http://travis-ci.org/node-xmpp/node-xmpp-client). The tests in travis run both the code and code style tests.

## How to use

Please see the various [examples](https://github.com/node-xmpp/node-xmpp-client/tree/master/examples).

## Features

* Client authentication with SASL DIGEST-MD5, PLAIN, ANONYMOUS, X-FACEBOOK-PLATFORM
* `_xmpp-client._tcp` SRV record support
* Even runs in the Browser.

## Dependencies

* [node-xmpp-core](https://github.com/node-xmpp/ltx): `node-xmpp` core libraries

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

## Browser Support

`node-xmpp-client` now comes with a prebuilt browser bundle:

```html
<script src="/node_modules/node-xmpp/node-xmpp-browser.js"></script>
<script type="text/javascript">
    var client = new XMPP.Client(opts);
</script>
```

# Keepalives

Rather than send empty packets in order to keep any socket alive please try the following:

```
this.client.connection.socket.setTimeout(0)
this.client.connection.socket.setKeepAlive(true, 10000)
```

Where `this.client` is the result of `new require('node-xmpp-client')()`.
