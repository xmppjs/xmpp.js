'use strict'

const _Plugin = require('./lib/Plugin')
const jid = require('@xmpp/jid')
const xml = require('@xmpp/xml')

function plugin(name, props, dependencies = []) {
  class Plugin extends _Plugin {}
  Object.assign(Plugin.prototype, props)

  return {
    name,
    plugin(entity) {
      const p = new Plugin()
      p.attach(entity)

      const plugins = {}
      dependencies.forEach(dep => {
        plugins[dep.name] = entity.plugin(dep)
      })
      p.plugins = plugins

      return p
    },
    unplug() {
      // FIXME
    },
  }
}

module.exports = plugin.bind(undefined)
module.exports.plugin = plugin
module.exports.Plugin = _Plugin
module.exports.jid = jid
module.exports.xml = xml
