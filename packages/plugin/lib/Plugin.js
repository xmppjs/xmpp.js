'use strict'

const EventEmitter = require('@xmpp/events')

class Plugin extends EventEmitter {
  attach (entity) {
    this.entity = entity
  }

  detach (entity) {
    delete this.entity
  }

  // override
  start () {}
  stop () {}
}

module.exports = Plugin
