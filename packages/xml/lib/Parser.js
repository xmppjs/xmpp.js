'use strict'

const LtxParser = require('ltx/lib/parsers/ltx')
const Element = require('./Element')
const EventEmitter = require('events')
const XMLError = require('./XMLError')

class Parser extends EventEmitter {
  constructor() {
    super()
    const parser = new LtxParser()
    this.root = null
    this.cursor = null

    parser.on('startElement', this.onStartElement.bind(this))
    parser.on('endElement', this.onEndElement.bind(this))
    parser.on('text', this.onText.bind(this))

    this.parser = parser
  }

  onStartElement(name, attrs) {
    const element = new Element(name, attrs)

    const {root, cursor} = this

    if (!root) {
      this.root = element
      this.emit('start', element)
    } else if (cursor !== root) {
      cursor.append(element)
    }

    this.cursor = element
  }

  onEndElement(name) {
    const {root, cursor} = this
    if (name !== cursor.name) {
      // <foo></bar>
      this.emit('error', new XMLError(`${cursor.name} must be closed.`))
      return
    }

    if (cursor === root) {
      this.emit('end', root)
      return
    }

    if (!cursor.parent) {
      cursor.parent = root
      this.emit('element', cursor)
      this.cursor = root
      return
    }

    this.cursor = cursor.parent
  }

  onText(str) {
    const {cursor} = this
    if (!cursor) {
      this.emit('error', new XMLError(`${str} must be a child.`))
      return
    }

    cursor.t(str)
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
