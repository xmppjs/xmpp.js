# xmpp.js

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

### universal

It aims to run everywhere JavaScript runs and make use of the best network transport available.

### reliable

By default, it handles errors and will automatically reconnect. With appropriate configuration it will even loop through a list of endpoints. You don't have to write a single line of code to handle network failures.

Releases follow the [Semantic Versioning specification](http://semver.org/)

### modular

Each feature is implemented as a module that can be added or removed easily. Including core XMPP features.

### small

We avoid third party dependencies.

For the web, we make the sure the default [client](/packages/client) doesn't exceed 15 kb (gzipped), for reference, that's less than half the size of [React](https://reactjs.org/blog/2017/09/26/react-v16.0.html#reduced-file-size).

## Built with xmpp.js

- [Simplo](https://simplo.app/?lang=en)
- [Crypho](https://www.crypho.com/)
- [HearMe.App](https://www.hearme.app/)
- [Wobbly](https://wobbly.app/)
- [Alcatel-Lucent Rainbow](https://www.openrainbow.com/)
- [Telldus](https://telldus.com/)
- [ConnectyCube](https://connectycube.com/)
- [Sockethub](http://sockethub.org/)
- [matrix-bitfrost](https://github.com/matrix-org/matrix-bifrost)
- [WordPress Telegram Bot](https://github.com/Automattic/wp-telegram-bot)
- [Logictech Harmony Hub library](https://github.com/AirBorne04/harmonyhub)

<small> Feel free to send a PR to add your project or organization to this list.</small>

## credits

xmpp.js is a rewrite of [node-xmpp](https://github.com/xmppjs/xmpp.js/tree/node-xmpp) and learned a lot from it.

Thanks to all xmpp.js and node-xmpp [contributors](https://github.com/xmppjs/xmpp.js/graphs/contributors).
