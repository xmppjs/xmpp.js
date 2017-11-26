'use strict'

const EventEmitter = require('@xmpp/events/lib/EventEmitter')

class Reconnect extends EventEmitter {
  constructor(entity) {
    super()

    this.delay = 1000
    this.entity = entity
  }

  reconnect() {
    const {entity, delay} = this
    this.emit('reconnecting')
    this._timeout = setTimeout(() => {
      if (entity.status === 'offline') {
        return
      }
      // Allow calling start() even though status is not offline
      // reset status property right after
      const {status} = entity
      entity.status = 'offline'

      entity
        .start(entity.startOptions)
        .then(() => {
          this.emit('reconnected')
        })
        .catch(() => this.reconnect())
        .catch(err => {
          this.emit('error', err)
        })
      entity.status = status
    }, delay)
  }

  start() {
    const {entity} = this
    const listeners = {}
    listeners.disconnect = () => {
      this.reconnect()
    }
    listeners.online = () => {
      entity.on('disconnect', listeners.disconnect)
    }
    this.listeners = listeners
    entity.once('online', listeners.online)
  }

  stop() {
    const {entity} = this
    const {listeners, _timeout} = this
    entity.removeListener('disconnect', listeners.disconnect)
    clearTimeout(_timeout)
    entity.removeListener('online', this.listeners.online)
  }
}

module.exports = function reconnect(entity) {
  const r = new Reconnect(entity)
  r.start()
  return r
}
