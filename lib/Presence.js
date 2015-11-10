'use strict'

var Stanza = require('./Stanza')
var inherits = require('inherits')

function Presence (attrs) {
  Stanza.call(this, 'presence', attrs)
}

inherits(Presence, Stanza)

module.exports = Presence
