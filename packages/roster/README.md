# roster

[roster management](https://xmpp.org/rfcs/rfc6121.html#roster) for `@xmpp/client`.

Supports Node.js and browsers.

## Install

```js
npm install @xmpp/roster
```

## Usage

```js
const {xmpp} = require('@xmpp/client')
const {entity, iqCaller, iqCallee} = xmpp(...)
const roster = require('@xmpp/roster/consumer')({entity, iqCaller, iqCallee})
```

### Get

Retrieve the roster.

`ver` is optional and refers to [roster versioning](https://xmpp.org/rfcs/rfc6121.html#roster-versioning-request).

```js
const [roster, newever] = await roster.get(ver)
if (!roster) {
  // the roster hasn't changed since last version
  return
}

console.log(roster)
/*
  [
    {
      jid: JID('foo@bar'), // see https://github.com/xmppjs/xmpp.js/tree/master/packages/jid
      name: 'Foo Bar',
      approved: false,
      subscription: 'none',
      groups: [],
      ask: false,
    },
    ...

  ]
*/
```

### Set

Add or update a roster entry.

```js
await roster.set({jid: 'foo@bar', name: 'Foo Bar'})
```

### Remove

Remove a roster entry.

```js
await roster.remove(jid)
```

### Set event

Emitted when a roster entry was added or updated.

```js
roster.on('set', ([item, ver]) => {
  console.log(item)
  // see Get

  console.log(ver)
  // new roster versioning string
})
```

### Remove event

Emitted when a roster entry was removed.

```js
roster.on('remove', ([jid, ver]) => {
  console.log(jid.toString(), 'removed')

  console.log(ver)
  // new roster versioning string
})
```

## References

[RFC-6121: Managing the Roster](https://xmpp.org/rfcs/rfc6121.html#roster)
