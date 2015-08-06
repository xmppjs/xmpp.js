'use strict'

var Stanza = require('./Stanza')
  , util = require('util')

function Message(attrs) {
    Stanza.call(this, 'message', attrs)
}

util.inherits(Message, Stanza)

module.exports = Message
