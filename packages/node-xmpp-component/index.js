'use strict'

var Component = require('./lib/Component')
var core = require('node-xmpp-core')

module.exports = Component
module.exports.Component = Component

core.exportCoreUtils(module.exports)
