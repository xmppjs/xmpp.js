'use strict';

var Connection = require('./node-xmpp-core/lib/connection')
  , Client = require('./node-xmpp-client/client')
  , Component = require('./node-xmpp-component/component')
  , C2SServer = require('./node-xmpp-server/lib/c2s/server')
  , C2SStream = require('./node-xmpp-server/lib/c2s/stream')
  , JID = require('./node-xmpp-core/lib/jid')
  , Router = require('./node-xmpp-server/router')
  , ltx = require('ltx')
  , Stanza = require('./node-xmpp-core/lib/stanza')

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
exports.BOSHServer = require('./node-xmpp-server/bosh_server')
exports.StreamParser = require('./node-xmpp-core/lib/stream_parser')
