'use strict'

const _Element = require('ltx/lib/Element')

class Element extends _Element {
  setAttrs(attrs) {
    if (typeof attrs === 'string') {
      this.attrs.xmlns = attrs
    } else if (attrs) {
      Object.keys(attrs).forEach(function(key) {
        const val = attrs[key]
        if (val !== undefined && val !== null)
          this.attrs[key.toString()] = val.toString()
      }, this)
    }
  }

  append(nodes) {
    nodes = Array.isArray(nodes) ? nodes : [nodes]
    nodes.forEach(node => {
      this.children.push(node)
      if (typeof node === 'object') {
        node.parent = this
      }
    })
    return this
  }

  prepend(nodes) {
    nodes = Array.isArray(nodes) ? nodes : [nodes]
    nodes.forEach(node => {
      this.children.unshift(node)
      if (typeof node === 'object') {
        node.parent = this
      }
    })
    return this
  }
}

module.exports = Element
