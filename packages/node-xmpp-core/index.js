'use strict'

var Connection = require('./lib/Connection')
var StreamParser = require('@xmpp/streamparser')

var JID = require('@xmpp/jid')
var xml = require('@xmpp/xml')
var inherits = require('inherits')

exports.SRV = require('./lib/SRV')

exports.exportCoreUtils = function (obj) {
  // core
  obj.Connection = Connection
  obj.StreamParser = StreamParser

  // jid
  obj.JID = JID

  // inherits
  obj.inherits = inherits

  // xml
  obj.stanza = xml
  obj.Stanza = xml.Stanza
  obj.createStanza = xml.createStanza
  obj.IQ = xml.IQ
  obj.Presence = xml.Presence
  obj.Message = xml.Message
  obj.Parser = xml.Parser
  obj.parse = xml.parse

  // ltx
  obj.ltx = xml.ltx
  obj.createElement = xml.createElement
  obj.Element = xml.Element
  obj.escapeXML = xml.escapeXML
  obj.escapeXMLText = xml.escapeXMLText
}

exports.exportCoreUtils(exports)
