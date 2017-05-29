'use strict'

const inherits = require('inherits')
const {Element} = require('ltx')

function Stanza(name, attrs) {
  Element.call(this, name, attrs)
}

inherits(Stanza, Element)

/**
 * Common attribute getters/setters to all stanzas
 * http://xmpp.org/rfcs/rfc6120.html#stanzas-attributes
 */

Object.defineProperty(Stanza.prototype, 'from', {
  get() {
    return this.attrs.from
  },
  set(from) {
    this.attrs.from = from
  },
})

Object.defineProperty(Stanza.prototype, 'to', {
  get() {
    return this.attrs.to
  },
  set(to) {
    this.attrs.to = to
  },
})

Object.defineProperty(Stanza.prototype, 'id', {
  get() {
    return this.attrs.id
  },
  set(id) {
    this.attrs.id = id
  },
})

Object.defineProperty(Stanza.prototype, 'type', {
  get() {
    return this.attrs.type
  },
  set(type) {
    this.attrs.type = type
  },
})

module.exports = Stanza
