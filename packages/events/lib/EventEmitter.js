'use strict'

const _EventEmitter = require('events')

class EventEmitter extends _EventEmitter {
  constructor(...args) {
    super(...args)
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

module.exports = EventEmitter
