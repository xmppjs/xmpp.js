'use strict'

var IQ = require('./lib/IQ')
  , Presence = require('./lib/Presence')
  , Message = require('./lib/Message')
  , ltx = require('ltx')

var Stanza = require('./lib/Stanza')
// deprecated, let's remove them at some point
Stanza.Iq = IQ
Stanza.Presence = Presence
Stanza.Message = Message
Stanza.Element = ltx.Element
Stanza.Stanza = Stanza

exports.Stanza = Stanza
exports.JID = require('./lib/JID')
exports.Connection = require('./lib/Connection')
exports.SRV = require('./lib/SRV')
exports.StreamParser = require('./lib/StreamParser')
exports.ltx = ltx
exports.Element = ltx.Element
exports.IQ = IQ
exports.Presence = Presence
exports.Message = Message
