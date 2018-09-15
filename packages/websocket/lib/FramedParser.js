'use strict'

const {Parser, Element, XMLError} = require('@xmpp/xml')

module.exports = class FramedParser extends Parser {
  onStartElement(name, attrs) {
    const element = new Element(name, attrs)

    const {cursor} = this

    if (cursor) {
      cursor.append(element)
    }

    this.cursor = element
  }

  onEndElement(name) {
    const {cursor} = this
    if (name !== cursor.name) {
      // <foo></bar>
      this.emit('error', new XMLError(`${cursor.name} must be closed.`))
      return
    }

    if (cursor.parent) {
      this.cursor = cursor.parent
      return
    }

    if (cursor.is('open', 'urn:ietf:params:xml:ns:xmpp-framing')) {
      this.emit('start', cursor)
    } else if (cursor.is('close', 'urn:ietf:params:xml:ns:xmpp-framing')) {
      this.emit('end', cursor)
    } else {
      this.emit('element', cursor)
    }

    this.cursor = null
  }
}
