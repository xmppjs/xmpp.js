var Connection = require('node-xmpp-core').Connection
  , Client = require('node-xmpp-client')
  , JID = require('node-xmpp-core').JID
  , ltx = require('ltx')
  , Stanza = require('node-xmpp-core').Stanza

exports.Connection = Connection
exports.Client = Client
exports.JID = JID
exports.Element = ltx.Element
exports.Stanza = Stanza.Stanza
exports.Message = Stanza.Message
exports.Presence = Stanza.Presence
exports.Iq = Stanza.Iq

window.XMPP = exports
