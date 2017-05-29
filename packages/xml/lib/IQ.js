'use strict'

const Stanza = require('./Stanza')
const inherits = require('inherits')

function IQ(attrs) {
  Stanza.call(this, 'iq', attrs)
}

inherits(IQ, Stanza)

module.exports = IQ
