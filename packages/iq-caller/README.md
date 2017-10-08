# iq-caller

Requests for `@xmpp/client` and `@xmpp/component`.

Supports Node.js and browsers.

## Install

```js
npm install @xmpp/plugins
```

## Usage

```js
client.plugin(require('@xmpp/plugins/iq-caller'))
```

### Get

```js
const caller = client.plugins['iq-caller']
caller.get(xml('time', 'urn:xmpp:time')).then((time) => {
  console.log(time.getChildText('tzo'))
  console.log(time.getChildText('utc'))
})
```

### Set

```js
const caller = client.plugins['iq-caller']
caller.set(
  xml('vCard', 'vcard-temp',
    xml('FN', 'bot')
  ),
).then(() => {
  console.log('done')
})
```


## References

[RFC 6120 IQ Semantics](https://xmpp.org/rfcs/rfc6120.html#stanzas-semantics-iq)
