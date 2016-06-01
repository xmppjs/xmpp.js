'use strict'

var Client = require('./lib/Client')
var SASL = require('./lib/sasl')
var core = require('node-xmpp-core')

module.exports = Client
module.exports.Client = Client
module.exports.SASL = SASL

core.exportCoreUtils(module.exports)
