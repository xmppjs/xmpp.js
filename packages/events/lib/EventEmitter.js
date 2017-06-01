'use strict'

const _EventEmitter = require('events')
const promise = require('./promise')

class EventEmitter {
  constructor() {
    this._emitter = new _EventEmitter()
    this._state = null
  }

  promise(...args) {
    return promise(this, ...args)
  }

  listen(event, listener) {
    this.on(event, listener)
    if (this._state === event) {
      listener()
    }
    return {
      unsuscribe() {
        this.removeListener(event, listener)
      },
    }
  }
}

['on', 'addListener', 'removeListener', 'once', 'emit', 'listenerCount'].forEach(name => {
  EventEmitter.prototype[name] = function (...args) {
    this._emitter[name](...args)
  }
})

module.exports = EventEmitter
