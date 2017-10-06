# time

[Entity Time](https://xmpp.org/extensions/xep-0202.html) for `@xmpp/client` and `@xmpp/component`.

Supports Node.js and browsers.

## Install

```js
npm install @xmpp/plugins
```

## Callee

Time callee allows the entity to reply to time queries.

```js
client.plugin(require('@xmpp/plugins/time/callee'))
```

The entity will automatically reply to time queries.

## Caller

`jid` parameter is optional

```js
const time = client.plugin(require('@xmpp/plugins/time/caller'))

time.get(jid).then(({tzo, utc}) => {
  console.log(tzo) // '+00:00'
  console.log(utc) // '2017-09-15T13:19:23Z'
})
```

## References

[XEP-0202: Entity Time](https://xmpp.org/extensions/xep-0202.html)
