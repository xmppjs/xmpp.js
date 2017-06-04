# reconnect

XMPP reconnect for JavaScript

Included and enabled in `@xmpp/component` and `@xmpp/client`.

`reconnect` will only be enabled if the entity is already online or after it goes online for the first time. Each reconnect will re-use the options provided to the entity `start` method.


## Install

```
npm install @xmpp/plugins
```

## Usage

```javascript
const reconnect = require('@xmpp/plugins/reconnect')
const entity = ...

const plugin = entity.plugin(reconnect)
```

### delay property

Property to set/get the delay in milliseconds between connection closed and reconnecting.

Default is `1000`.

```js
plugin.delay // 1000
plugin.delay = 2000
```

### reconnecting event

Emitted each time a re-connection is attempted.

```js
plugin.on('reconnecting', () => {
  console.log('reconnecting')
})
```

### reconnected event

Emitted each time a re-connection succeed.

```js
plugin.on('reconnected', () => {
  console.log('reconnected')
})
```

### error event

Emitted each time a re-connection fails.

```js
plugin.on('error', err => {
  console.error('reconnection error', err)
})
```
