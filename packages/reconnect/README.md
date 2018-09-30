# reconnect

Auto reconnect for `@xmpp/client` and `@xmpp/component`.

Included and enabled in `@xmpp/component` and `@xmpp/client`.

Supports Node.js and browsers.

Each reconnect will re-use the options provided to the entity `start` method.

## delay property

Property to set/get the delay in milliseconds between connection closed and
reconnecting.

Default is `1000`.

```js
reconnect.delay // 1000
reconnect.delay = 2000
```

## reconnecting event

Emitted each time a re-connection is attempted.

```js
reconnect.on('reconnecting', () => {
  console.log('reconnecting')
})
```

## reconnected event

Emitted each time a re-connection succeed.

```js
reconnect.on('reconnected', () => {
  console.log('reconnected')
})
```

## error event

Emitted on entity each time a re-connection fails.

```js
entity.on('error', err => {
  console.error(err)
})
```
