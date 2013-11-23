var Connection = require('./xmpp/connection')
  , Client = require('./xmpp/client').Client
  , JID = require('./xmpp/jid')
  , ltx = require('ltx')
  , Stanza = require('./xmpp/stanza')

exports.Connection = Connection
exports.Client = Client
exports.JID = JID
exports.Element = ltx.Element
exports.Stanza = Stanza.Stanza
exports.Message = Stanza.Message
exports.Presence = Stanza.Presence
exports.Iq = Stanza.Iq

window.XMPP = exports
