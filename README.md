# xmpp.js

[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)
[![build status](https://img.shields.io/travis/xmppjs/xmpp.js/master.svg?maxAge=2592000&style=flat-square)](https://travis-ci.org/xmppjs/xmpp.js/branches)
[![license](https://img.shields.io/github/license/xmppjs/xmpp.js.svg?maxAge=2592000&style=flat-square)](https://raw.githubusercontent.com/xmppjs/xmpp.js/master/LICENSE)

> XMPP is an open technology for real-time communication, which powers a wide range of applications including instant messaging, presence, multi-party chat, voice and video calls, collaboration, lightweight middleware, content syndication, and generalized routing of XML data.

> [xmpp.org/about-xmpp/technology-overview/](https://xmpp.org/about/technology-overview.html)

**xmpp.js** is a JavaScript library for [XMPP](http://xmpp.org/).

## Get started

- [client](/packages/client)
- [component](/packages/component)
- [xml](/packages/xml)
- [jid](/packages/jid)
- [time](/packages/time)
- [uri](/packages/uri)

## goals

#### universal

It aims to run everywhere JavaScript runs and make use of the best network transport available.

#### reliable

By default, it handles errors and will automatically reconnect. With appropriate configuration it will even loop through a list of endpoints. You don't have to write a single line of code to handle network failures.

Releases follow the [Semantic Versionning specification](http://semver.org/)

#### modular

Thanks to [lerna](https://lernajs.io/), xmpp.js is highly modular, each feature is implemented as a package and can be included or excluded. (even XMPP core features)

This allows to hand-pick what you need and reduce browser bundle. Additionally packages can be dynamically imported on demand.

#### modern

Written in ES2015, it provides a modern promise based API and will keep up with meaningful additions to the language.

## credits

xmpp.js is a rewrite of [node-xmpp](https://github.com/xmppjs/xmpp.js/tree/node-xmpp) and learned a lot from it.

Thanks to all xmpp.js and node-xmpp [contributors](https://github.com/xmppjs/xmpp.js/graphs/contributors).
