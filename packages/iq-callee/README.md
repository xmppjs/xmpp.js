# iq-callee

Requests handler for `@xmpp/client` and `@xmpp/component`.

Supports Node.js and browsers.

## Install

```js
npm install @xmpp/iq-callee
```

## Usage

```js
const _iqCallee = require('@xmpp/iq-callee')
const callee = _iqCaller({middleware, entity})
```

```js
// handle iq get query with that namespace
callee.get('jabber:iq:version', query => {
  console.log(query)
  return Promise.resolve()
})

// handle iq set query with that namespace
callee.set('jabber:iq:version', query => {
  console.log(query)
  return Promise.resolve()
})
```

## References

[RFC 6120 IQ Semantics](https://xmpp.org/rfcs/rfc6120.html#stanzas-semantics-iq)
