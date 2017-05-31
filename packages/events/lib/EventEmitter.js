'use strict'

const _EventEmitter = require('events')

class EventEmitter {
  constructor() {
    this._emitter = new _EventEmitter()
  }
}

['on', 'addListener', 'removeListener', 'once'].forEach(name => {
  EventEmitter.prototype[name] = function (...args) {
    this._emitter[name](...args)
  }
})

module.exports = EventEmitter
