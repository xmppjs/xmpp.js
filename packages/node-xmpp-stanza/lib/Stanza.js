'use strict'

var inherits = require('inherits')
var Element = require('ltx').Element

function Stanza (name, attrs) {
  Element.call(this, name, attrs)
}

inherits(Stanza, Element)

/**
 * Common attribute getters/setters to all stanzas
 * http://xmpp.org/rfcs/rfc6120.html#stanzas-attributes
 */

Object.defineProperty(Stanza.prototype, 'from', {
  get: function () {
    return this.attrs.from
  },
  set: function (from) {
    this.attrs.from = from
  }
})

Object.defineProperty(Stanza.prototype, 'to', {
  get: function () {
    return this.attrs.to
  },
  set: function (to) {
    this.attrs.to = to
  }
})

Object.defineProperty(Stanza.prototype, 'id', {
  get: function () {
    return this.attrs.id
  },
  set: function (id) {
    this.attrs.id = id
  }
})

Object.defineProperty(Stanza.prototype, 'type', {
  get: function () {
    return this.attrs.type
  },
  set: function (type) {
    this.attrs.type = type
  }
})

module.exports = Stanza
