'use strict'

var Stanza = require('./Stanza')
var inherits = require('inherits')

function Message (attrs) {
  Stanza.call(this, 'message', attrs)
}

inherits(Message, Stanza)

module.exports = Message
