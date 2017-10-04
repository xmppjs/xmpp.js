# roster

[roster management](https://xmpp.org/rfcs/rfc6121.html#roster) for `@xmpp/client-core`.

Included and enabled in `@xmpp/client`.

Supports Node.js and browsers.

## Install

```js
npm install @xmpp/plugins
```

## Usage


```js
const roster = client.plugin(require('@xmpp/plugins/roster'))
```

### Get

Retrieve the roster.

`ver` is optional and refers to [roster versioning](https://xmpp.org/rfcs/rfc6121.html#roster-versioning-request).

```js
roster.get(ver).then([roster, newver] => {
  if (!roster) {
    // the roster hasn't changed since last version
    return
  }

  console.log(roster)
  /*
  [
    {
      jid: 'foo@bar',
      name: 'Foo Bar',
      approved: false,
      subscription: 'none',
      groups: [],
      ask: false,
    },
    ...

  ]
  */
})
```

### Set

Add or update a roster entry.

```js
roster.set({jid: 'foo@bar', name: 'Foo Bar'}).then(() => {
  console.log('success')
})
```

### Remove

Remove a roster entry.

```js
roster.remove(jid).then(() => {
  console.log('success')
})
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
  console.log(jid, 'removed')

  console.log(ver)
  // new roster versioning string
})
```

## References

[RFC-6121: Managing the Roster](https://xmpp.org/rfcs/rfc6121.html#roster)
