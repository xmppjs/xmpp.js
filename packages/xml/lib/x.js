'use strict'

const Element = require('./Element')

function cnode(el, child) {
  if (child instanceof Element) {
    el.cnode(child)
  } else if (Array.isArray(child)) {
    child.forEach(c => cnode(el, c))
  } else if (child !== null && child !== undefined) {
    el.cnode(String(child))
  }
}

function x(name, attrs, ...children) {
  const el = new Element(name, attrs)
  for (let i = 0; i < children.length; i++) {
    cnode(el, children[i])
  }
  return el
}

module.exports = x
