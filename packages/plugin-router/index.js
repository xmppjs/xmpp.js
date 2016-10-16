'use strict'

function plugin (entity) {
  const routes = new Map()
  return {
    entity,
    routes,
    register () {
      this.entity.on('element', this.handler)
    },
    unregister () {
      this.entity.removeListener('element', this.handler)
    },
    add (match, handle) {
      routes.set(match, handle)
    },
    handler (stanza) {
      routes.forEach((handle, match) => {
        if (match(stanza)) handle(stanza, entity)
      })
    }
  }
}

module.exports.plugin = plugin
module.exports.name = 'router'
