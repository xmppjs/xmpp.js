'use strict'

class TimeoutError extends Error {
  constructor(message) {
    super(message)
    this.name = 'TimeoutError'
  }
}
TimeoutError.prototype.name = 'TimeoutError'

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
      return this.promise(event)
    }
    const expire = (...args) => {
      listener(...args)
      this.removeListener(event, expire)
    }
    this.addListener(event, expire)
  }
  promise(event, timeout) {
    return new Promise((resolve, reject) => {
      let timer
      const cleanup = () => {
        this.removeListener(event, onEvent)
        this.removeListener('error', onError)
        clearTimeout(timer)
      }
      if (typeof timeout === 'number') {
        timer = setTimeout(() => {
          reject(new TimeoutError(`"${event}" event didn't fire within ${timeout}ms`))
          cleanup()
        }, timeout)
      }
      function onError(reason) {
        reject(reason)
        cleanup()
      }
      function onEvent(value) {
        resolve(value)
        cleanup()
      }
      this.once('error', onError)
      this.once(event, onEvent)
    })
  }
  emit(event, arg) {
    const listeners = this._listeners.get(event)
    if (listeners) {
      listeners.forEach(listener => {
        listener(arg)
      })
    } else if (event === 'error') {
      throw arg instanceof Error ? arg : new Error(arg)
    }
  }
  listenerCount(event) {
    const listeners = this.listeners.get(event)
    return listeners ? listeners.size : 0
  }
}

module.exports = EventEmitter
