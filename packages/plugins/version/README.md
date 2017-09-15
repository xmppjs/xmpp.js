# version

[Software Version](https://xmpp.org/extensions/xep-0092.html) for `@xmpp/client-core` and `@xmpp/component-core`.

Included and enabled in `@xmpp/client`.

Supports Node.js and browsers.

## Install

```js
npm install @xmpp/plugins
```

## Callee

Version callee makes the entity automatically reply to version queries.

```js
const versionCallee = client.plugin(require('@xmpp/plugins/version/callee'))
versionCallee.name = 'xmpp.js' // required
versionCallee.version = '0.3.0' // required
versionCallee.os = 'milky way' // optional
```


## Caller

`jid` parameter is optional

```js
const version = client.plugin(require('@xmpp/plugins/version/caller'))

version.get(jid).then(({name, version, os}) => {
  console.log(name) // 'Prosody'
  console.log(version) // 'hg:97b3ca502547'
  console.log(os) // 'Linux'
})
```

## References

[XEP-0092: Software Version](https://xmpp.org/extensions/xep-0202.html)
