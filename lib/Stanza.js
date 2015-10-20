'use strict'

var inherits = require('inherits')
var Element = require('ltx/lib/Element')

function Stanza (name, attrs) {
  Element.call(this, name, attrs)
}

inherits(Stanza, Element)

Stanza.prototype.clone = function () {
  var clone = new Stanza(this.name, {})
  for (var k in this.attrs) {
    if (this.attrs.hasOwnProperty(k)) {
      clone.attrs[k] = this.attrs[k]
    }
  }
  for (var i = 0; i < this.children.length; i++) {
    var child = this.children[i]
    clone.cnode(child.clone ? child.clone() : child)
  }
  return clone
}

/**
 * Common attribute getters/setters to all stanzas
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

Stanza.createStanza = function (name, attrs /*, child1, child2, ...*/) {
  var el = new Stanza(name, attrs)

  var children = Array.prototype.slice.call(arguments, 2)

  children.forEach(function (child) {
    el.cnode(child)
  })
  return el
}

module.exports = Stanza
