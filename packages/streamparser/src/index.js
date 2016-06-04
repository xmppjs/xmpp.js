import EventEmitter from 'events'
import LtxParser from 'ltx/lib/parsers/ltx'
import {Element} from 'ltx'

/**
 * Recognizes <stream:stream> and collects stanzas used for ordinary
 * TCP streams and Websockets.
 *
 * API: write(data) & end(data)
 * Events: streamStart, stanza, end, error
 */
class StreamParser extends EventEmitter {
  constructor (options) {
    super()

    const ElementInterface = (options && options.Element) || Element
    const ParserInterface = (options && options.Parser) || LtxParser
    this.maxStanzaSize = options && options.maxStanzaSize
    this.parser = new ParserInterface()

    /* Count traffic for entire life-time */
    this.bytesParsed = 0
    /* Will be reset upon first stanza, but enforce maxStanzaSize until it is parsed */
    this.bytesParsedOnStanzaBegin = 0

    this.parser.on('startElement', (name, attrs) => {
      this.emit('startElement', name, attrs)

      const child = new ElementInterface(name, attrs)
      if (this.element) {
        if (this.element.name === 'stream:stream') {
          child.parent = this.element
        } else {
          this.element.cnode(child)
        }
      } else {
        /* For maxStanzaSize enforcement */
        this.bytesParsedOnStanzaBegin = this.bytesParsed
      }

      this.element = child
    })

    this.parser.on('endElement', (name) => {
      this.emit('endElement', name)

      if (!this.element || this.element.name !== name) {
        return this.error('xml-not-well-formed', 'XML parse error')
      }

      if (!this.element.parent || this.element.parent.name === 'stream:stream') {
        this.emit('element', this.element)
        delete this.element
        // maxStanzaSize doesn't apply until next startElement
        delete this.bytesParsedOnStanzaBegin
      } else {
        this.element = this.element.parent
      }
    })

    this.parser.on('text', (str) => {
      if (!this.element) {
        return this.error('xml-not-well-formed', 'XML parse error')
      }

      this.element.cnode(str)
    })

    this.parser.on('entityDecl', () => {
      /* Entity declarations are forbidden in XMPP. We must abort to
       * avoid a billion laughs.
       */
      this.error('xml-not-well-formed', 'No entity declarations allowed')
      this.end()
    })

    this.parser.on('error', this.emit.bind(this, 'error'))
  }

  write (data) {
    if (!this.parser) return // FIXME error?

    /* If a maxStanzaSize is configured, the current stanza must consist only of this many bytes */
    if (this.bytesParsedOnStanzaBegin && this.maxStanzaSize &&
      this.bytesParsed > this.bytesParsedOnStanzaBegin + this.maxStanzaSize) {
      this.error('policy-violation', 'Maximum stanza size exceeded')
      return
    }
    this.bytesParsed += data.length

    this.parser.write(data)
  }

  end (data) {
    if (data) {
      this.write(data)
    }
    delete this.parser
    this.emit('end')
  }

  error (condition, message) {
    const e = new Error(message)
    e.condition = condition
    this.emit('error', e)
  }
}

export default StreamParser
