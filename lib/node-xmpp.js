'use strict';

var Connection = require('./xmpp/connection')
  , Client = require('./xmpp/client').Client
  , Component = require('./xmpp/component').Component
  , C2SServer = require('./xmpp/c2s/server')
  , C2SStream = require('./xmpp/c2s/stream')
  , JID = require('./xmpp/jid').JID
  , Router = require('./xmpp/router')
  , ltx = require('ltx')
  , Stanza = require('./xmpp/stanza')

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
exports.Router = Router.Router
exports.BOSHServer = require('./xmpp/bosh_server').BOSHServer
exports.StreamParser = require('./xmpp/stream_parser')
