'use strict'

var Stanza = require('./Stanza')
  , inherits = require('inherits')

function Presence(attrs) {
    Stanza.call(this, 'presence', attrs)
}

inherits(Presence, Stanza)

module.exports = Presence
