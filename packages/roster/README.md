# roster

[roster management](https://xmpp.org/rfcs/rfc6121.html#roster) for `@xmpp/client`.

Supports Node.js and browsers.

## Install

```sh
npm install @xmpp/features/roster
```

```js
const {client, xml} = require('@xmpp/client')
const xmpp = client(...)
const roster = require('@xmpp/roster/consumer')(xmpp)
```

## Get

Retrieve the roster.

`ver` is optional and refers to [roster versioning](https://xmpp.org/rfcs/rfc6121.html#roster-versioning-request).

```js
const query = await roster.get(version)
if (!query) {
  // the roster hasn't changed since version
  return
}
console.log(query)
```

## Set

Add or update a roster entry.

```js
await roster.set({jid: 'foo@bar', name: 'Foo Bar'})
```

## Remove

Remove a roster entry.

```js
await roster.remove('foo@bar')
```

## Set event

Emitted when a roster entry was added or updated.

```js
roster.on('set', ([item, ver]) => {
  console.log(item)

  console.log(ver)
  // new roster version string
})
```

### Remove event

Emitted when a roster entry was removed.

```js
roster.on('remove', ([jid, ver]) => {
  console.log(jid.toString(), 'removed')

  console.log(ver)
  // new roster version string
})
```

## Example

This is a complete example with caching using an hypothetical `asyncStorage` module.

```js
const {client, xml} = require('@xmpp/client')
const xmpp = client(...)
const roster = require('@xmpp/roster')(xmpp)

async function fetchRoster() {
  const ver = await asyncStorage.get('version')
  const query = await roster.get(ver)

  // Roster hasn't changed since ver
  if (!query) {
    return xml.parse(await asyncStorage.get('roster'))
  }

  try {
    await asyncStorage.set('version', quer.attrs.ver)
    await asyncStorage.set('roster', query.toString())
  } catch (err) {
    console.error(err)
  }

  return query
}

xmpp.on('online', async () => {
  let
  try {
    query = await fetchRoster()
  } catch(err) {
    console.error(err)
    return
  }
  console.log()
})

```

## References

[RFC-6121: Managing the Roster](https://xmpp.org/rfcs/rfc6121.html#roster)
