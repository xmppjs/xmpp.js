'use strict'

const {Parser} = require('@xmpp/xml')

module.exports = class FramedParser extends Parser {
  onStartElement() {}
  onEndElement(element, length) {
    if (length === 1) {
      if (element.is('open', 'urn:ietf:params:xml:ns:xmpp-framing')) {
        this.emit('start', element)
      } else if (element.is('close', 'urn:ietf:params:xml:ns:xmpp-framing')) {
        this.emit('end', element)
      } else {
        this.emit('element', element)
      }
    }
  }
}
