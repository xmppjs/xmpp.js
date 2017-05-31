'use strict'

const promise = require('./promise')

class EventEmitter {
  constructor() {
    this._listeners = new Map()
  }
  on(...args) {
    this.addListener(...args)
  }
  off(...args) {
    this.removeListener(...args)
  }
  addListener(event, listener) {
    let listeners = this._listeners.get(event)
    if (!listeners) {
      listeners = new Set()
      this._listeners.set(event, listeners)
    }
    listeners.add(listener)
  }
  removeListener(event, listener) {
    const listeners = this._listeners.get(event)
    if (listeners) {
      listeners.delete(listener)
      if (listeners.size === 0) {
        this._listeners.delete(event)
      }
    }
  }
  once(event, listener) {
    if (!listener) {
      return promise(this, event)
    }
    const expire = (...args) => {
      listener(...args)
      this.removeListener(event, expire)
    }
    this.addListener(event, expire)
  }
  emit(event, ...values) {
    const listeners = this._listeners.get(event)
    if (listeners) {
      listeners.forEach(listener => {
        listener(...values)
      })
    } else if (event === 'error') {
      const [err] = values
      throw err instanceof Error ? err : new Error(err)
    }
  }
  listenerCount(event) {
    const listeners = this._listeners.get(event)
    return listeners ? listeners.size : 0
  }
}

module.exports = EventEmitter
