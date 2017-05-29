'use strict'

const plugin = require('@xmpp/plugin')

module.exports = plugin('stanza-router', {
  start() {
    this.routes = new Map()
    this.handler = element => {
      this.routes.forEach((handle, match) => {
        if (match(element)) {
          handle(element, this.entity)
        }
      })
    }
    this.entity.on('element', this.handler)
  },
  stop() {
    delete this.routes
    this.entity.off('element', this.handler)
    delete this.handler
  },
  add(match, handle) {
    this.routes.set(match, handle)
  },
  remove(match) {
    this.routes.delete(match)
  },
})
