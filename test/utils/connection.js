'use strict';

var EventEmitter = require('events').EventEmitter
  , util = require('util')
  , ltx = require('ltx')

var Connection = function() {}

util.inherits(Connection, EventEmitter)

Connection.prototype.xmlns = {}

Connection.prototype.send = function(stanza) {
    this.lastSent = stanza
}

Connection.prototype.getLastSent = function() {
    return this.lastSent
}

Connection.prototype.listen = function() {
    this.emit('connect')
}

Connection.prototype.startStream = function() {
    var attrs = {}
    for (var k in this.xmlns) {
        if (this.xmlns.hasOwnProperty(k)) {
            if (!k)
                attrs.xmlns = this.xmlns[k]
            else
                attrs['xmlns:' + k] = this.xmlns[k]
        }
    }
    for (k in this.streamAttrs) {
        if (this.streamAttrs.hasOwnProperty(k))
            attrs[k] = this.streamAttrs[k]
    }

    if (this.streamTo) { // in case of a component connecting
        attrs.to = this.streamTo
    }

    var el = new ltx.Element('stream:stream', attrs)
    // make it non-empty to cut the closing tag
    el.t(' ')
    var s = el.toString()
    this.send(s.substr(0, s.indexOf(' </stream:stream>')))

    this.streamOpened = true
}

module.exports = Connection