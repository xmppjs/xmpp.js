'use strict'

var Client = require('./lib/Client')
var SASL = require('./lib/sasl')
var core = require('node-xmpp-core')

exports.Client = Client
exports.SASL = SASL
exports.Iq = core.IQ

core.exportCoreUtils(exports)

window.XMPP = exports
