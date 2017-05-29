'use strict'

const Element = require('./Element')

/**
 * JSX compatible API, use this function as pragma
 * https://facebook.github.io/jsx/
 *
 * @param  {string} name  name of the element
 * @param  {object} attrs object of attribute key/value pairs
 * @return {Element}      Element
 */
module.exports = function createElement(name, attrs, ...children) {
  const el = new Element(name, attrs)
  if (children) {
    el.children = children
  }
  return el
}
