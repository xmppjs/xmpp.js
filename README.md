# xmpp.js

xmpp.js is an Open Source Javascript [XMPP](http://xmpp.org/) client.

XMPP is an open technology for real-time communication, which powers a wide range of applications including instant messaging, presence, multi-party chat, voice and video calls, collaboration, lightweight middleware, content syndication, and generalized routing of XML data. [Find out more at xmpp.org](https://xmpp.org/about/technology-overview.html)

# Status

[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)
[![build status](https://img.shields.io/travis/xmppjs/xmpp.js/master.svg?maxAge=2592000&style=flat-square)](https://travis-ci.org/xmppjs/xmpp.js/branches)
[![license](https://img.shields.io/github/license/xmppjs/xmpp.js.svg?maxAge=2592000&style=flat-square)](https://raw.githubusercontent.com/xmppjs/xmpp.js/master/LICENSE)

## Getting started

Use npm or yarn to install one or many of the following modules:

- [client](/packages/client) - connects to an xmpp server
- [component](/packages/component) - like a client when extending an xmpp server
- [xml](/packages/xml) - construct xml (not needed if client is used)
- [jid](/packages/jid) - use  Jabber IDs
- [time](/packages/time) - date / time profiles
- [uri](/packages/uri) - URI parsing

Installation and set-up instructions are included with each module.

## Our goals

#### A universal library

xmpp.js aims to run everywhere JavaScript runs and make use of the best network transport available.

#### Reliability

By default, it handles errors and will automatically reconnect. With appropriate configuration it will even loop through a list of endpoints - you don't have to write a single line of code to handle network failures.

#### Structured versions

Releases follow the [Semantic Versionning specification](http://semver.org/).

#### Modular

Thanks to [lerna](https://lernajs.io/), xmpp.js is highly modular. Each feature is implemented as a separate package and can be included or excluded, even XMPP core features!

This approach enables the implementer to hand-pick the modules required and reduce the overall browser bundle downloaded. Additionally packages can be dynamically imported on demand.

#### Modern

Written to the [ES2015 Javascript standard](https://en.wikipedia.org/wiki/ECMAScript), it provides a modern [Promise based API](https://www.promisejs.org/) and will keep up with meaningful additions to the language.

## Licence

xmpp.js is licensed under the [ISC License](https://opensource.org/licenses/ISC) - a permissive free software license published by the Internet Software Consortium. 

## Credits

xmpp.js is a rewrite of [node-xmpp](https://github.com/xmppjs/xmpp.js/tree/node-xmpp) and learned a lot from it.

Thanks to all xmpp.js and node-xmpp [contributors](https://github.com/xmppjs/xmpp.js/graphs/contributors).
