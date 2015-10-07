'use strict'

var Client = require('./lib/Client')
var JID = require('node-xmpp-jid')
var Stanza = require ('node-xmpp-core').Stanza
var SASL = require('./lib/sasl')
var ltx = require('node-xmpp-core').ltx

module.exports = Client
module.exports.SASL = SASL
module.exports.Client = Client
module.exports.Stanza = Stanza
module.exports.ltx = ltx
module.exports.JID = JID
