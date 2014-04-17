'use strict';

var Connection = require('node-xmpp-core').Connection
  , Client = require('node-xmpp-client')
  , Component = require('node-xmpp-component')
  , C2SServer = require('node-xmpp-server').C2SServer
  , C2SStream = require('node-xmpp-server').C2SStream
  , JID = require('node-xmpp-core').JID
  , Router = require('node-xmpp-server').Router
  , ltx = require('ltx')
  , Stanza = require('node-xmpp-core').Stanza

exports.Connection = Connection
exports.Client = Client
exports.Component = Component
exports.C2SServer = C2SServer
exports.C2SStream = C2SStream
exports.JID = JID
exports.Element = ltx.Element
exports.Stanza = Stanza.Stanza
exports.Message = Stanza.Message
exports.Presence = Stanza.Presence
exports.Iq = Stanza.Iq
exports.Router = Router
exports.BOSHServer = require('node-xmpp-server').BOSHServer
exports.StreamParser = require('node-xmpp-core').StreamParser
