'use strict'

var Connection = require('./lib/Connection')
var StreamParser = require('./lib/StreamParser')

var JID = require('node-xmpp-jid')
var stanza = require('node-xmpp-stanza')
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

  // stanza
  obj.stanza = stanza
  obj.Stanza = stanza.Stanza
  obj.createStanza = stanza.createStanza
  obj.IQ = stanza.IQ
  obj.Presence = stanza.Presence
  obj.Message = stanza.Message
  obj.Parser = stanza.Parser
  obj.parse = stanza.parse

  // ltx
  obj.ltx = stanza.ltx
  obj.createElement = stanza.createElement
  obj.Element = stanza.Element
  obj.escapeXML = stanza.escapeXML
  obj.escapeXMLText = stanza.escapeXMLText
}

exports.exportCoreUtils(exports)
