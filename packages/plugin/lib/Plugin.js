'use strict'

const EventEmitter = require('@xmpp/events')

class Plugin extends EventEmitter {
  attach(entity) {
    this.entity = entity
  }

  detach() {
    delete this.entity
  }

  // Override
  start() {}
  stop() {}
}

module.exports = Plugin
