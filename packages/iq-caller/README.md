# iq-caller

Requests for `@xmpp/client` and `@xmpp/component`.

Supports Node.js and browsers.

## Install

```js
npm install @xmpp/iq-caller
```

## Usage

```js
const _iqCaller = require('@xmpp/iq-caller')
const iqCaller = _iqCaller({middleware, entity})
```

### Get

```js
iqCaller.get(xml('time', 'urn:xmpp:time')).then(time => {
  console.log(time.getChildText('tzo'))
  console.log(time.getChildText('utc'))
})
```

### Set

```js
iqCaller.set(xml('vCard', 'vcard-temp', xml('FN', 'bot'))).then(() => {
  console.log('done')
})
```

## References

[RFC 6120 IQ Semantics](https://xmpp.org/rfcs/rfc6120.html#stanzas-semantics-iq)
