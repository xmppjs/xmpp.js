'use strict'

var Stanza = require('./Stanza')
var inherits = require('inherits')

function IQ (attrs) {
  Stanza.call(this, 'iq', attrs)
}

inherits(IQ, Stanza)

module.exports = IQ
