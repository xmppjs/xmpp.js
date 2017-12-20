'use strict'

const EventEmitter = require('@xmpp/events/lib/EventEmitter')

class Reconnect extends EventEmitter {
  constructor(entity) {
    super()

    this.delay = 1000
    this.entity = entity
    this._timeout = null
  }

  scheduleReconnect() {
    const {entity, delay, _timeout} = this
    clearTimeout(_timeout)
    this._timeout = setTimeout(() => {
      if (entity.status === 'offline') {
        return
      }
      this.reconnect()
    }, delay)
  }

  reconnect() {
    const {entity} = this
    this.emit('reconnecting')

    // Allow calling start() even though status is not offline
    // reset status property right after
    const {status} = entity
    entity.status = 'offline'

    entity
      .start(entity.startOptions)
      .then(() => {
        this.emit('reconnected')
      })
      .catch(err => {
        entity.emit('error', err)
      })
    entity.status = status
  }

  start() {
    const {entity} = this
    const listeners = {}
    listeners.disconnect = () => {
      this.scheduleReconnect()
    }
    this.listeners = listeners
    entity.on('disconnect', listeners.disconnect)
  }

  stop() {
    const {entity, listeners, _timeout} = this
    entity.removeListener('disconnect', listeners.disconnect)
    clearTimeout(_timeout)
  }
}

module.exports = function reconnect(entity) {
  const r = new Reconnect(entity)
  r.start()
  return r
}
