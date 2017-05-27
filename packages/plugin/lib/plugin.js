'use strict'

const _Plugin = require('./Plugin')

module.exports = function plugin (name, props, dependencies = []) {
  class Plugin extends _Plugin {}
  Object.assign(Plugin.prototype, props)

  return {
    name,
    plugin (entity) {
      const p = new Plugin()
      p.attach(entity)

      const plugins = {}
      dependencies.forEach((dep) => {
        plugins[dep.name] = entity.plugin(dep)
      })
      p.plugins = plugins

      return p
    },
    unplug (entity) {
      // FIXME
    },
  }
}
