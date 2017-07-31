# xmpp.js

> XMPP is an open technology for real-time communication, which powers a wide range of applications including instant messaging, presence, multi-party chat, voice and video calls, collaboration, lightweight middleware, content syndication, and generalized routing of XML data.

> [xmpp.org/about-xmpp/technology-overview/](https://xmpp.org/about/technology-overview.html)

xmpp.js is a JavaScript library for [XMPP](http://xmpp.org/).

## goals

#### universal

It aims to run everywhere JavaScript runs and make use of the best network transport available.

#### reliable

By default, it handles errors and will automatically reconnect. With appropriate configuration it will even loop through a list of endpoints. You don't have to write a single line of code to handle network failures.

Releases follow the [Semantic Versionning specification](http://semver.org/)

#### modular

Thanks to [lerna](https://lernajs.io/), xmpp.js is highly modular, each feature is implemented as a plugin and can be included or excluded. (even XMPP core features)

This allows to hand-pick what you need and reduce browser bundle. Additionally plugins can be dynamically imported on demand.

For now the list of plugins is limited but will be completed over time.

#### modern

Written in ES2015, it provides a modern promise based API and will keep up with meaningful additions to the standard.

## credits

xmpp.js is a rename and rewrite of the node-xmpp project and learned a lot from it.

Thanks to all xmpp.js and node-xmpp [contributors](https://github.com/xmppjs/xmpp.js/graphs/contributors).
