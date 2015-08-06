'use strict'

var Stanza = require('./Stanza')
  , util = require('util')

function IQ(attrs) {
    Stanza.call(this, 'iq', attrs)
}

util.inherits(IQ, Stanza)

module.exports = IQ
