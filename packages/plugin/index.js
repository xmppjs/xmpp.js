'use strict'

const _Plugin = require('./lib/Plugin')
const plugin = require('./lib/plugin')
const jid = require('@xmpp/jid')
const xml = require('@xmpp/xml')

module.exports = plugin.bind(undefined)
module.exports.plugin = plugin
module.exports.Plugin = _Plugin
module.exports.jid = jid
module.exports.xml = xml
