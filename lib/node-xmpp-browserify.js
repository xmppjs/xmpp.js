/* eslint-env browser */

'use strict'

var core = require('./core')
  , Client = require('./client')
  , ltx = require('ltx')

exports.Client = Client

exports.Element = ltx.Element

exports.JID = core.JID
exports.Connection = core.Connection
exports.Stanza = core.Stanza.Stanza
exports.Message = core.Stanza.Message
exports.Presence = core.Stanza.Presence
exports.Iq = core.Stanza.Iq

window.XMPP = exports
