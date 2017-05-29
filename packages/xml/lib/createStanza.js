'use strict'

const Stanza = require('./Stanza')
const {Element} = require('ltx')

/**
 * JSX compatible API, use this function as pragma
 * https://facebook.github.io/jsx/
 * Returns a Stanza if name is presence, message or iq an ltx Element otherwise.
 *
 * @param  {string} name  name of the element
 * @param  {object} attrs object of attribute key/value pairs
 * @return {Element}      Stanza or Element
 */
module.exports = function createStanza(name, attrs, ...children) {
  let el

  switch (name) {
  case 'presence':
  case 'message':
  case 'iq':
    el = new Stanza(name, attrs)
    break
  default:
    el = new Element(name, attrs)
  }

  el.children = children
  return el
}
