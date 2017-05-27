'use strict'

const Stanza = require('./Stanza')
const inherits = require('inherits')

function Presence (attrs) {
  Stanza.call(this, 'presence', attrs)
}

inherits(Presence, Stanza)

module.exports = Presence
