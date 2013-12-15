# node-xmpp

idiomatic XMPP library for [node.js](http://nodejs.org/)

Now usable in browsers too thanks to [Browserify](https://github.com/substack/node-browserify).

[![build status](https://secure.travis-ci.org/node-xmpp/node-xmpp.png)](http://travis-ci.org/node-xmpp/node-xmpp)

## Sub-modules

We've split `node-xmpp` into a set of submodules, realistically its now one of these that you'll want to use rather than `node-xmpp` itself. This project remains so existing users can continue to use the project, and as a location for integration tests. New users should make use of the sub-modules.

[![build status](https://secure.travis-ci.org/node-xmpp/node-xmpp-server.png)](http://travis-ci.org/node-xmpp/node-xmpp-server) [node-xmpp-server](https://github.com/node-xmpp/node-xmpp-server.git)

[![build status](https://secure.travis-ci.org/node-xmpp/node-xmpp-client.png)](http://travis-ci.org/node-xmpp/node-xmpp-client) [node-xmpp-client](https://github.com/node-xmpp/node-xmpp-client.git)

[![build status](https://secure.travis-ci.org/node-xmpp/node-xmpp-component.png)](http://travis-ci.org/node-xmpp/node-xmpp-component) [node-xmpp-component](https://github.com/node-xmpp/node-xmpp-component.git)

[![build status](https://secure.travis-ci.org/node-xmpp/node-xmpp-core.png)](http://travis-ci.org/node-xmpp/node-xmpp-core) [node-xmpp-core](https://github.com/node-xmpp/node-xmpp-core.git)

## Installation

__Note:__ We now only support nodejs versions 0.8.0 and greater.

With package manager [npm](http://npmjs.org/):

    npm install node-xmpp

### Testing

Install the dev dependencies, then...

```npm test```

To run the tests and the code style checks then use:

```grunt test```

Also see the tests run in [travis](http://travis-ci.org/astro/node-xmpp). The tests in travis run both the code and code style tests.

## How to use

Please see the various [examples](https://github.com/astro/node-xmpp/tree/master/examples).

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
* Even runs in the Browser.


## Dependencies

* [node-expat](http://github.com/astro/node-expat) (requires libexpat!)
* [ltx](http://github.com/astro/ltx)

Optional

* [node-stringprep](http://github.com/astro/node-stringprep): for [icu](http://icu-project.org/)-based string normalization.


## Built with node-xmpp

* [Sockethub](http://sockethub.org) by using [node-simple-xmpp](https://github.com/arunoda/node-simple-xmpp/)
* [hubot-xmpp](https://github.com/markstory/hubot-xmpp/)
* [superfeedr-node](https://github.com/superfeedr/superfeedr-node)
* [xmpp-ftw](https://xmpp-ftw.jit.su)

## Related Libraries

* [node-xmpp-bosh](http://code.google.com/p/node-xmpp-bosh/): BOSH & websocket server (connection manager)
* [node-xmpp-via-bosh](https://github.com/anoopc/node-xmpp-via-bosh/): BOSH client connections from node.js
* [node-simple-xmpp](https://github.com/arunoda/node-simple-xmpp/): Simpler high-level client layer
* [xmpp-server](https://github.com/superfeedr/xmpp-server/): Reusable XMPP server on top of node-xmpp
* [node-xmpp-joap](https://github.com/flosse/node-xmpp-joap/): Jabber Object Access Protocol (XEP-0075) library for node-xmpp
* [node-xmpp-serviceadmin](https://github.com/flosse/node-xmpp-serviceadmin/): Service Administration (XEP-0133) library for node-xmpp
* [Junction](https://github.com/jaredhanson/junction): An extensible XMPP middleware layer
* [xmpp-ftw](https://github.com/lloydwatkin/xmpp-ftw): XMPP For The Web ::: Powerful XMPP, simple JSON
* [Lightstream](https://github.com/dodo/Lightstream): XMPP Framework

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

## Browser Support

node-xmpp now comes with a prebuilt browser bundle:

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

Where `this.client` is the result of `new require('node-xmpp').Client()`.

## Development Roadmap

For the next releases, we will focus on stability and security of `node-xmpp`. Pull requests are welcome to position `node-xmpp` as the best, most secure and most stable xmpp library for nodejs.

`node-xmpp-core`:

 * manifesto: support the STARTTLS method in XMPP as specified in RFC 6120, including mandatory-to-implement cipher suites and certificate validation consistent with RFC 6125
 * manifesto: prefer the latest version of TLS (TLS 1.2) #192
 * manifesto: disable support for the older and less secure SSL standard (SSLv2 and SSLv3)
 * manifesto: provide configuration options to require channel encryption for client-to-server and server-to-server connections
 * manifesto: provide configuration options to prefer or require cipher  suites that enable forward secrecy
 * Events harmonization
 * Common pause/resume/... for any Client/Component/Server session
 * Smoothen reconnect
 * Properly disconnect on stream errors, not on connection errors
 * more tests to verify against [RFC3920](http://xmpp.org/rfcs/rfc3920.html)

`node-xmpp-client`:

 * Lookup BOSH URLs in DNS TXT records
 * Move connecting to connection, use WS/BOSH as TCP fallback
 * Ensure tls end/close/drain events
 * Possible may to use `strophe` plugins with `node-xmpp`, see [dodo/Lightstream](https://github.com/dodo/Lightstream)
 * more tests to verify against [RFC3921](http://xmpp.org/rfcs/rfc3921.html)
 * more demo apps to spead the usage
 * develop high-level client-api as seperate project to use json as input and output, see inspiration [xmpp-ftw/xmpp-ftw](https://github.com/xmpp-ftw/xmpp-ftw)
 * work on early DNSSEC implementation, see [XMPP-DNA](http://tools.ietf.org/html/draft-saintandre-xmpp-dna-01) and [DNSSEC](http://tools.ietf.org/html/draft-miller-xmpp-dnssec-prooftype-04)

`node-xmpp-server`:

 * simple Websockets server (at least for testing the client)
 * Tests for S2S connections
 * maifesto: prefer authenticated encryption
 * harmonize c2s, bosh and websocket server components


# Documentation

(Builing up documentation slowly)

## C2S Client to Server 

```
var client = new xmpp.Client({
    jid: 'user@example.com',
    password: 'password'
})

client.on('connection', function() {
    console.log('online')
})

client.on('stanza', function(stanza) {
    console.log('Incoming stanza: ', stanza.toString())
})
```

### Closing a connection

```
client.end()
```
