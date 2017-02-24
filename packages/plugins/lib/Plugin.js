'use strict'

const EventEmitter = require('events')

class Plugin extends EventEmitter {
  constructor (entity) {
    super()
    this.entity = entity
  }
}

module.exports = Plugin
