'use strict'

var ltx = require('ltx')

module.exports.IQ = require('./lib/IQ')
module.exports.Message = require('./lib/Message')
module.exports.Presence = require('./lib/Presence')

module.exports.Stanza = require('./lib/Stanza')
module.exports.createStanza = require('./lib/createStanza')

module.exports.parse = require('./lib/parse')
module.exports.Parser = require('./lib/Parser')

module.exports.Element = ltx.Element
module.exports.createElement = ltx.createElement

module.exports.escapeXML = ltx.escapeXML
module.exports.escapeXMLText = ltx.escapeXMLText

module.exports.equal = ltx.equal
module.exports.nameEqual = ltx.nameEqual
module.exports.attrsEqual = ltx.attrsEqual
module.exports.childrenEqual = ltx.childrenEqual

module.exports.ltx = ltx
