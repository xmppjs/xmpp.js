var Client = require('./index')
  , core = require('./lib/xmpp').core
  , Connection = core.Connection
  , JID = core.JID
  , Element = core.Stanza.Element
  , Stanza = core.Stanza
  , ltx = core.ltx

exports.Connection = Connection
exports.Client = Client
exports.JID = JID
exports.Element = Element
exports.Stanza = Stanza.Stanza
exports.Message = Stanza.Message
exports.Presence = Stanza.Presence
exports.Iq = Stanza.Iq
exports.ltx = ltx

window.XMPP = exports
