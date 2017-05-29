'use strict'

const LtxParser = require('ltx/lib/parsers/ltx')
const Element = require('./Element')
const EventEmitter = require('events')

class XMLError extends Error {
  constructor(...args) {
    super(...args)
    this.name = 'XMLError'
  }
}

class Parser extends EventEmitter {
  constructor() {
    super()

    const parser = new LtxParser()
    const stack = []
    let cursor

    parser.on('startElement', (name, attrs) => {
      const child = new Element(name, attrs)
      if (cursor) {
        cursor.cnode(child)
        this.emit('startElement', child, false)
      } else {
        this.emit('startElement', child, true)
      }
      stack.push(cursor)
      cursor = child
    })
    parser.on('endElement', name => {
      if (name === cursor.name) {
        if (stack.length === 1) {
          this.emit('endElement', cursor, true)
        } else {
          this.emit('endElement', cursor, false)
        }
        cursor = stack.pop()
      } else {
        // <foo></bar>
        this.emit('error', new XMLError(`${cursor.name} must be closed.`))
      }
    })

    parser.on('text', str => {
      this.onText(str, cursor)
    })
    this.parser = parser
  }
  onText(str, element) {
    if (!element) {
      this.emit('error', new XMLError(`${str} must be a child.`))
      return
    }
    element.t(str)
  }
  write(data) {
    this.parser.write(data)
  }
  end(data) {
    if (data) {
      this.parser.write(data)
    }
  }
}

Parser.XMLError = XMLError

module.exports = Parser
