# xmpp.js

> XMPP is the Extensible Messaging and Presence Protocol, a set of open technologies for instant messaging, presence, multi-party chat, voice and video calls, collaboration, lightweight middleware, content syndication, and generalized routing of XML data.

[xmpp.org/about-xmpp/technology-overview/](https://xmpp.org/about/technology-overview.html)

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

Runs everywhere JavaScript runs and makes use of the best network transport available.

xmpp.js is known to be used with browsers, [Node.js](https://nodejs.org/), [WebWorker](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers), [React Native](https://reactnative.dev/), [Bun](https://bun.sh/), [Deno](https://deno.com/), [GJS](https://gitlab.gnome.org/GNOME/gjs/) and [Duktape](https://duktape.org/).

### reliable

By default, it handles errors and will automatically reconnect. With appropriate configuration it will even loop through a list of endpoints. You don't have to write a single line of code to handle network failures.

Releases follow the [Semantic Versioning specification](http://semver.org/)

### modular

Each feature is implemented as a module that can be added or removed easily. Including core XMPP features.

### small

There are no third party dependencies.

For the web, we make the sure the default [client](/packages/client) doesn't exceed 13 kb (gzipped), for reference, that's less than half the size of [React](https://reactjs.org/blog/2017/09/26/react-v16.0.html#reduced-file-size).

## Getting help

Do you need help with working with xmpp.js? Please reach out to our community by posting in the [Discussions section](https://github.com/xmppjs/xmpp.js/discussions) of this project.

## Built with xmpp.js

- [Snikket](https://snikket.org/)
- [xmpp-web](https://github.com/nioc/xmpp-web/)
- [WorkAdventure](https://workadventu.re/)
- [Mustang](https://www.mustang.im/)
- [Crypho](https://www.crypho.com/)
- [MeshCentral](https://meshcentral.com/)
- [openHAB](https://www.openhab.org/)
- [Wobbly](https://wobbly.app/)
- [Alcatel-Lucent Rainbow](https://www.openrainbow.com/)
- [Telldus](https://telldus.com/)
- [ConnectyCube](https://connectycube.com/)
- [Sockethub](http://sockethub.org/)
- [matrix-bitfrost](https://github.com/matrix-org/matrix-bifrost)
- [WordPress Telegram Bot](https://github.com/Automattic/wp-telegram-bot)
- [Logitech Harmony Hub library](https://github.com/AirBorne04/harmonyhub)
- [gx-twilio: Bridge between Twilio SMS and XMPP](https://github.com/pesvut/sgx-twilio)
- [FACEIT Chatbot Service](https://github.com/areimx/faceit-ext-chatbot-service)

<small>Feel free to send a PR to add your project or organization to this list.</small>

## Protocols

[RFC 6120](https://tools.ietf.org/html/rfc6120) - Extensible Messaging and Presence Protocol (XMPP): Core

See [`@xmpp/client-core`](packages/client-core) and [`@xmpp/component-core`](packages/component-core)

Included in [`@xmpp/client`](packages/client) and [`@xmpp/component`](packages/component)

---

[RFC 7590](https://tools.ietf.org/html/rfc7590) - Use of Transport Layer Security (TLS) in the Extensible Messaging and Presence Protocol (XMPP)

See [`@xmpp/tls`](packages/tls)

Included in [`@xmpp/client`](packages/client)

---

<!-- [RFC 6121](https://tools.ietf.org/html/rfc6121) - Extensible Messaging and Presence Protocol (XMPP): Instant Messaging and Presence ✗ -->

<!-- --- -->

[RFC 7622](https://tools.ietf.org/html/rfc7622) - Extensible Messaging and Presence Protocol (XMPP): Address Format

See [`@xmpp/jid`](packages/jid)

Included in [`@xmpp/client`](packages/client) and [`@xmpp/component`](packages/component)

---

[RFC 7395](https://tools.ietf.org/html/rfc7395) - An Extensible Messaging and Presence Protocol (XMPP) Subprotocol for WebSocket

See [`@xmpp/websocket`](packages/websocket)

Included in [`@xmpp/client`](packages/client)

---

[draft-cridland-xmpp-session-01](https://tools.ietf.org/html/draft-cridland-xmpp-session-01) Here Lies Extensible Messaging and Presence Protocol (XMPP) Session Establishment

See [`@xmpp/session-establishment`](packages/session-establishment)

---

[XEP-0368](https://xmpp.org/extensions/xep-0368.html): SRV records for XMPP over TLS

See [`@xmpp/resolve`](packages/resolve)

Included in [`@xmpp/client`](packages/client)

---

[XEP-0156](https://xmpp.org/extensions/xep-0156.html): Discovering Alternative XMPP Connection Methods

See [`@xmpp/resolve`](packages/resolve)

Included in [`@xmpp/client`](packages/client)

---

[XEP-0114](https://xmpp.org/extensions/xep-0114.html): Jabber Component Protocol

See [`@xmpp/component-core`](packages/component-core)

Included in [`@xmpp/component`](packages/component)

---

[XEP-0082](https://xmpp.org/extensions/xep-0082.html): XMPP Date and Time Profiles

See [`@xmpp/time`](packages/time)

---

[XEP-0198](https://xmpp.org/extensions/xep-0198.html): Stream Management

See [`@xmpp/stream-management`](packages/stream-management)

Included in [`@xmpp/client`](packages/client)

---

[XEP-0388](https://xmpp.org/extensions/xep-0388.html): Extensible SASL Profile

See [`@xmpp/sasl2`](packages/sasl2)

Included in [`@xmpp/client`](packages/client)

---

[XEP-0386](https://xmpp.org/extensions/xep-0386.html): Bind 2

See [`@xmpp/client-core`](./packages/client-core/src/bind2/)

Included in [`@xmpp/client`](packages/client)

---

[XEP-0484](https://xmpp.org/extensions/xep-0484.html): Fast Authentication Streamlining Tokens

See [`@xmpp/client-core`](./packages/client-core/src/fast/)

Included in [`@xmpp/client`](packages/client)

## credits

xmpp.js is a rewrite of [node-xmpp](https://github.com/xmppjs/xmpp.js/tree/node-xmpp) and learned a lot from it.

Thanks to all xmpp.js and node-xmpp [contributors](https://github.com/xmppjs/xmpp.js/graphs/contributors).
