'use strict'

var Client = require('./lib/Client')
var SASL = require('./lib/sasl')
var core = require('node-xmpp-core')

module.exports = Client
module.exports.Client = Client
module.exports.SASL = SASL

module.exports.core = core
module.exports.Connection = core.Connection
module.exports.Stanza = core.Stanza
module.exports.Presence = core.Presence
module.exports.IQ = core.IQ
module.exports.Iq = core.IQ
module.exports.Message = core.Message
module.exports.ltx = core.ltx
module.exports.Element = core.Element
module.exports.parse = core.parse
module.exports.createElement = core.createElement
module.exports.createStanza = core.createStanza
module.exports.JID = core.JID
