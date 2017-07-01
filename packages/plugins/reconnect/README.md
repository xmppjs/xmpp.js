# reconnect

Auto reconnect.

Included and enabled in `@xmpp/component` and `@xmpp/client`.

Supports Node.js and browsers.

`reconnect` will only be enabled once the entity goes online for the first time. Each reconnect will re-use the options provided to the entity `start` method.


## Install

```
npm install @xmpp/plugins
```

## Usage

```javascript
const reconnect = entity.plugin(require('@xmpp/plugins/reconnect'))
```

### delay property

Property to set/get the delay in milliseconds between connection closed and reconnecting.

Default is `1000`.

```js
reconnect.delay // 1000
reconnect.delay = 2000
```

### reconnecting event

Emitted each time a re-connection is attempted.

```js
reconnect.on('reconnecting', () => {
  console.log('reconnecting')
})
```

### reconnected event

Emitted each time a re-connection succeed.

```js
reconnect.on('reconnected', () => {
  console.log('reconnected')
})
```

### error event

Emitted each time a re-connection fails.

```js
reconnect.on('error', err => {
  console.error('reconnection error', err)
})
```
