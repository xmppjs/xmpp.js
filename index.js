'use strict'

var core = require('./core')
  , Client = require('./client')
  , Component = require('./component')
  , server = require('./server')
  , ltx = require('ltx')

exports.Element = ltx.Element

exports.Client = Client

exports.Component = Component

exports.C2SServer = server.C2SServer
exports.C2SStream = server.C2SStream
exports.BOSHServer = server.BOSHServer
exports.WebSocketServer = server.WebSocketServer
exports.Router = server.Router

exports.Connection = core.Connection
exports.JID = core.JID
exports.Stanza = core.Stanza.Stanza
exports.Message = core.Stanza.Message
exports.Presence = core.Stanza.Presence
exports.Iq = core.Stanza.Iq
exports.StreamParser = core.StreamParser
