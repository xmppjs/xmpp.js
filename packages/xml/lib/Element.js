'use strict'

const _Element = require('ltx/lib/Element')

class Element extends _Element {
  append(nodes) {
    nodes = Array.isArray(nodes) ? nodes : [nodes]
    nodes.forEach(node => {
      this.children.push(node)
      if (typeof node === 'object') {
        node.parent = this
      }
    })
  }

  prepend(nodes) {
    nodes = Array.isArray(nodes) ? nodes : [nodes]
    nodes.forEach(node => {
      this.children.unshift(node)
      if (typeof node === 'object') {
        node.parent = this
      }
    })
  }
}

module.exports = Element
