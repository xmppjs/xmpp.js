# entity-capabilities

[Entity Capabilities](https://xmpp.org/extensions/xep-0115.html) for `@xmpp/client`.

Supports Node.js and browsers.

If you need extended browser support please checkout [webcrypto-shim](https://github.com/vibornoff/webcrypto-shim#supported-browsers) and [text-encoding](https://github.com/inexorabletash/text-encoding) polyfills.

## Install

```js
npm install @xmpp/plugins
```

## Usage

```js
const caps = client.plugin(require('@xmpp/plugins/entity-capabilities'))
```

This plugin will automatically add your entity capabilities to outgoing presences.

## References

[XEP-0115: Entity Capabilities](https://xmpp.org/extensions/xep-0115.html)
