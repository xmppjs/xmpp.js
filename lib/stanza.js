'use strict';

var util = require('util')
  , ltx = require('ltx')

function Stanza(name, attrs) {
    ltx.Element.call(this, name, attrs)
}

util.inherits(Stanza, ltx.Element)

/**
 * Common attribute getters/setters for all stanzas
 */

Object.defineProperty(Stanza, 'from', {
    get: function() {
        return this.attrs.from
    },

    set: function(from) {
        this.attrs.from = from
    }
});

Object.defineProperty(Stanza, 'to', {
    get: function() {
        return this.attrs.to
    },

    set: function(to) {
        this.attrs.to = to
    }
});

Object.defineProperty(Stanza, 'id', {
    get: function() {
        return this.attrs.id
    },

    set: function(id) {
        this.attrs.id = id
    }
});

Object.defineProperty(Stanza, 'type', {
    get: function() {
        return this.attrs.type
    },

    set: function(type) {
        this.attrs.type = type
    }
});

/**
 * Stanza kinds
 */

function Message(attrs) {
    Stanza.call(this, 'message', attrs)
}

util.inherits(Message, Stanza)

function Presence(attrs) {
    Stanza.call(this, 'presence', attrs)
}

util.inherits(Presence, Stanza)

function Iq(attrs) {
    Stanza.call(this, 'iq', attrs)
}

util.inherits(Iq, Stanza)

exports.Stanza = Stanza
exports.Message = Message
exports.Presence = Presence
exports.Iq = Iq