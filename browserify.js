'use strict'

var Client = require('./lib/Client')
var SASL = require('./lib/sasl')
var core = require('node-xmpp-core')

exports.Client = Client
exports.SASL = SASL

exports.core = core
exports.Connection = core.Connection
exports.Stanza = core.Stanza
exports.Presence = core.Presence
exports.IQ = core.IQ
exports.Iq = core.IQ
exports.Message = core.Message
exports.ltx = core.ltx
exports.Element = core.Element
exports.parse = core.parse
exports.createElement = core.createElement
exports.createStanza = core.createStanza
exports.JID = core.JID

window.XMPP = exports
