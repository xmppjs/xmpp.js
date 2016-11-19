# reconnect

XMPP reconnect for JavaScript

Included in `@xmpp/component`.

## Install

```
npm install @xmpp/reconnect
```

## Usage

```javascript
const reconnect = require('@xmpp/reconnect')
const entity = ...

const plugin = entity.plugin(reconnect)

plugin.getDelay() // default is 1000ms
plugin.setDelay(2000)

entity.on('reconnecting', () => {
  console.log('reconnecting')
})

entity.on('reconnected', () => {
  console.log('reconnected')
})

```
