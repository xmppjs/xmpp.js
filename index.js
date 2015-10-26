'use strict'

var Stanza = require('./lib/Stanza')
var IQ = require('./lib/IQ')
var Presence = require('./lib/Presence')
var Message = require('./lib/Message')
var Connection = require('./lib/Connection')
var StreamParser = require('./lib/StreamParser')

var JID = require('node-xmpp-jid').JID
var ltx = require('ltx')
var inherits = require('inherits')

Stanza.Iq = IQ // DEPRECATED
Stanza.Presence = Presence // DEPRECATED
Stanza.Message = Message // DEPRECATED
Stanza.Element = ltx.Element // DEPRECATED
Stanza.Stanza = Stanza // DEPRECATED

exports.SRV = require('./lib/SRV')

exports.exportCoreUtils = function (obj) {
  // core
  obj.Connection = Connection
  obj.StreamParser = StreamParser
  obj.Stanza = Stanza
  obj.createStanza = Stanza.createStanza
  obj.IQ = IQ
  obj.Presence = Presence
  obj.Message = Message

  // ltx
  obj.ltx = ltx
  obj.Element = ltx.Element
  obj.createElement = ltx.createElement
  obj.escapeXML = ltx.escapeXML
  obj.escapeXMLText = ltx.escapeXMLText
  obj.Parser = ltx.Parser
  obj.parse = ltx.parse

  // jid
  obj.JID = JID

  // inherits
  obj.inherits = inherits
}

exports.exportCoreUtils(exports)
