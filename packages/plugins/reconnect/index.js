'use strict'

const plugin = require('@xmpp/plugin')

function delay(timeout) {
  return new Promise(resolve => setTimeout(resolve, timeout))
}

module.exports = plugin('reconnect', {
  delay: 1000,
  reconnect() {
    const {entity} = this
    this.emit('reconnecting')
    return delay(this.delay).then(() => {
      entity.start(entity.startOptions)
      .then(() => {
        this.emit('reconnected')
      })
      .catch(err => {
        this.emit('error', err)
        this.reconnect()
      })
    })
  },
  enable() {
    this.entity.on('close', () => this.reconnect())
  },
  start() {
    const {entity} = this

    if (entity.jid) {
      this.enable()
    } else {
      entity.once('online', () => this.enable())
    }
  },
  stop() {
    this.entity.removeListener('online', this.enable)
    this.entity.removeListener('close', this.onClose)
    clearTimeout(this._timeout)
  },
})
