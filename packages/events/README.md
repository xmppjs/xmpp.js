# events

A modern and lightweight EventEmitter implementation.

## Install

`npm install @xmpp/events`

## Differences with Node.js EventEmitter

### size

| @xmpp/events | 2KB |
|----------------------|----:|
| Node.js EventEmitter   | 9KB |

`@xmpp/events` is much smaller but doesn't implement:

* max listeners
* listeners ordering
* `eventNames()`

### promise

```javascript
emitter.promise(event)
  .then(console.log)
  .catch(console.error)
```

Returns a promise that resolves when `event` is emitted and rejects when `error` is emitted.

### off

```javascript
emitter.off('event', listener)
```

A simple alias to `.removeListener()`.
