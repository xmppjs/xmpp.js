var Connection = require('node-xmpp-core').Connection
  , Client = require('./index')
  , JID = require('node-xmpp-core').JID
  , Element = require('node-xmpp-core').Stanza.Element
  , Stanza = require('node-xmpp-core').Stanza

exports.Connection = Connection
exports.Client = Client
exports.JID = JID
exports.Element = Element
exports.Stanza = Stanza.Stanza
exports.Message = Stanza.Message
exports.Presence = Stanza.Presence
exports.Iq = Stanza.Iq

window.XMPP = exports
