'use strict'

const Element = require('./Element')

function append(el, child) {
  if (child === false || child === null || child === undefined) return
  if (child instanceof Element) {
    el.append(child)
  } else if (Array.isArray(child)) {
    child.forEach(c => append(el, c))
  } else {
    el.append(String(child))
  }
}

function x(name, attrs, ...children) {
  const el = new Element(name, attrs)
  // eslint-disable-next-line unicorn/no-for-loop
  for (let i = 0; i < children.length; i++) {
    append(el, children[i])
  }

  return el
}

module.exports = x
