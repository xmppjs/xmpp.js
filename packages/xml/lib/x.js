'use strict'

const Element = require('./Element')

function removeUndefinedProperties(obj) {
  Object.keys(obj).forEach(key => obj[key] === undefined && delete obj[key])
}

function append(el, child) {
  if (child instanceof Element) {
    el.append(child)
  } else if (Array.isArray(child)) {
    child.forEach(c => append(el, c))
  } else if (child !== null && child !== undefined) {
    el.append(String(child))
  }
}

function x(name, attrs, ...children) {
  if (attrs) {
    removeUndefinedProperties(attrs)
  }
  const el = new Element(name, attrs)
  for (let i = 0; i < children.length; i++) {
    append(el, children[i])
  }
  return el
}

module.exports = x
