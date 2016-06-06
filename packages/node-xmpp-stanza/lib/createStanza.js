'use strict'

var Stanza = require('./Stanza')
var Element = require('ltx').Element

/**
 * JSX compatible API, use this function as pragma
 * https://facebook.github.io/jsx/
 * Returns a Stanza if name is presence, message or iq an ltx Element otherwise.
 *a
 * @param  {string} name  name of the element
 * @param  {object} attrs object of attribute key/value pairs
 * @return {Element}      Stanza or Element
 */
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
