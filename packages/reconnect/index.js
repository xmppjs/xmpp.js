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
        // eslint-disable-next-line no-unused-vars
      } catch (err) {
        // Ignoring the rejection is safe because the error is emitted on entity by #start
      }
    }, delay)
  }

  async reconnect() {
    const {entity} = this
    this.emit('reconnecting')

    const {service, domain, lang} = entity.options
    await entity.connect(service)
    await entity.open({domain, lang})

    this.emit('reconnected')
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
