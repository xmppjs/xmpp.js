'use strict'

var Connection = require('./connection')
  , util = require('util')
  , Element = require('ltx').Element

var NS_XMPP_FRAMING = 'urn:ietf:params:xml:ns:xmpp-framing'

function FrameConnection(options) {
    Connection.call(this, options)
    this.streamAttrs['xmlns'] = NS_XMPP_FRAMING
}
util.inherits(FrameConnection, Connection)

FrameConnection.prototype.startStream = function() {
    var attrs = {}
    for (var k in this.xmlns) {
        if (this.xmlns.hasOwnProperty(k)) {
            if (!k) {
                attrs.xmlns = this.xmlns[k]
            } else {
                attrs['xmlns:' + k] = this.xmlns[k]
            }
        }
    }
    for (k in this.streamAttrs) {
        if (this.streamAttrs.hasOwnProperty(k)) {
            attrs[k] = this.streamAttrs[k]
        }
    }

    var el = new Element('open', attrs)
    this.send(el)

    this.streamOpened = true
}

module.exports = FrameConnection
