'use strict'

var Stanza = require('./Stanza')
var Element = require('ltx').Element

module.exports = function createStanza (name, attrs /*, child1, child2, ...*/) {
  var el

  switch (name) {
    case 'presence':
    case 'message':
    case 'iq':
      el = new Stanza(name, attrs)
      break
    default:
      el = new Element(name, attrs)
  }

  var children = Array.prototype.slice.call(arguments, 2)

  children.forEach(function (child) {
    el.cnode(child)
  })
  return el
}
