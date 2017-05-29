'use strict'

const Stanza = require('./Stanza')
const inherits = require('inherits')

function Message(attrs) {
  Stanza.call(this, 'message', attrs)
}

inherits(Message, Stanza)

module.exports = Message
