'use strict'

const _EventEmitter = require('events')

class EventEmitter {
  constructor() {
    this._emitter = new _EventEmitter()
    this._handlers = Object.create(null)
  }

  handle(event, handler) {
    this._handlers[event] = handler
  }

  delegate(event, ...args) {
    const handler = this._handlers[event]
    if (!handler) {
      throw new Error(`${event} has no handler attached.`)
    }
    const promise = handler(...args)
    if (!(promise instanceof Promise)) {
      throw new TypeError(`${event} handler must return a promise.`)
    }
    return promise
  }

  isHandled(event) {
    return Boolean(this._handlers[event])
  }
}

;[
  'on',
  'addListener',
  'removeListener',
  'once',
  'emit',
  'listenerCount',
].forEach(name => {
  EventEmitter.prototype[name] = function(...args) {
    this._emitter[name](...args)
  }
})

module.exports = EventEmitter
