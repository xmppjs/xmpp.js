'use strict'

const {EventEmitter} = require('@xmpp/events')

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
    this._timeout = setTimeout(async () => {
      if (entity.status !== 'disconnect') {
        return
      }

      try {
        await this.reconnect()
      } catch (err) {
        // Ignoring the rejection is safe because the error is emitted on entity by #start
      }
    }, delay)
  }

  reconnect() {
    const {entity} = this
    this.emit('reconnecting')

    // Allow calling start() even though status is not offline
    // reset status property right after
    const {status} = entity
    entity.status = 'offline'

    const start = entity.start(entity.startOptions)

    entity.status = status

    return start.then(() => {
      this.emit('reconnected')
    })
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

module.exports = function reconnect({entity}) {
  const r = new Reconnect(entity)
  r.start()
  return r
}
