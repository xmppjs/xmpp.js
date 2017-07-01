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
        cursor.append(child)
      }
      this.onStartElement(child, cursor)
      this.emit('startElement', child)
      stack.push(cursor)
      cursor = child
    })
    parser.on('endElement', name => {
      if (name === cursor.name) {
        this.onEndElement(cursor, stack.length)
        this.emit('endElement', cursor)
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
  onStartElement(element, cursor) {
    if (!cursor) {
      this.emit('start', element)
    }
  }
  onEndElement(element, length) {
    if (length === 2) {
      this.emit('element', element)
    } else if (length === 1) {
      this.emit('end', element)
    }
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
