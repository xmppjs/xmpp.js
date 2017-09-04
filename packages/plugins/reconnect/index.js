'use strict'

const plugin = require('@xmpp/plugin')

module.exports = plugin('reconnect', {
  delay: 1000,

  reconnect() {
    const {entity} = this
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
    }, this.delay)
  },

  stopped() {
    const {entity, listeners, _timeout} = this
    entity.removeListener('disconnect', listeners.disconnect)
    clearTimeout(_timeout)
  },

  start() {
    const listeners = {}
    listeners.disconnect = () => {
      this.reconnect()
    }
    listeners.online = () => {
      this.entity.on('disconnect', listeners.disconnect)
    }
    this.listeners = listeners
    this.entity.once('online', listeners.online)
  },

  stop() {
    this.stopped()
    this.entity.removeListener('online', this.listeners.online)
  },
})
