'use strict'

var Stanza = require('./Stanza')
  , util = require('util')

function Presence(attrs) {
    Stanza.call(this, 'presence', attrs)
}

util.inherits(Presence, Stanza)

module.exports = Presence
