'use strict'

var inherits = require('inherits')
var EventEmitter = require('events').EventEmitter
var LtxParser = require('ltx/lib/parsers/ltx')
var xml = require('@xmpp/xml')
var Stanza = xml.Stanza
var Element = xml.Element

/**
 * Recognizes <stream:stream> and collects stanzas used for ordinary
 * TCP streams and Websockets.
 *
 * API: write(data) & end(data)
 * Events: streamStart, stanza, end, error
 */
function StreamParser (options) {
  EventEmitter.call(this)
  var self = this

  var ElementInterface = (options && options.Element) || Element
  var ParserInterface = (options && options.Parser) || LtxParser
  this.maxStanzaSize = options && options.maxStanzaSize
  this.parser = new ParserInterface()

  /* Count traffic for entire life-time */
  this.bytesParsed = 0
  /* Will be reset upon first stanza, but enforce maxStanzaSize until it is parsed */
  this.bytesParsedOnStanzaBegin = 0

  this.parser.on('startElement', function (name, attrs) {
    if (!self.element) {
      self.emit('startElement', name, attrs)
      self.emit('start', new Element(name, attrs))
    }

    // TODO: refuse anything but <stream:stream>
    if (!self.element && (name === 'stream:stream')) {
      self.emit('streamStart', attrs)
    } else {
      var child
      if (!self.element) {
        /* A new stanza */
        child = new Stanza(name, attrs)
        self.element = child
        /* For maxStanzaSize enforcement */
        self.bytesParsedOnStanzaBegin = self.bytesParsed
      } else {
        /* A child element of a stanza */
        child = new ElementInterface(name, attrs)
        self.element = self.element.cnode(child)
      }
    }
  })

  this.parser.on('endElement', function (name) {
    if (!self.element) {
      self.emit('endElement', name)
    }

    if (!self.element && (name === 'stream:stream')) {
      self.end()
    } else if (self.element && (name === self.element.name)) {
      if (self.element.parent) {
        self.element = self.element.parent
      } else {
        /* element complete */
        self.emit('element', self.element)
        self.emit('stanza', self.element) // FIXME deprecate
        delete self.element
        /* maxStanzaSize doesn't apply until next startElement */
        delete self.bytesParsedOnStanzaBegin
      }
    } else {
      self.error('xml-not-well-formed', 'XML parse error')
    }
  })

  this.parser.on('text', function (str) {
    if (self.element) self.element.t(str)
  })

  this.parser.on('entityDecl', function () {
    /* Entity declarations are forbidden in XMPP. We must abort to
     * avoid a billion laughs.
     */
    self.error('xml-not-well-formed', 'No entity declarations allowed')
    self.end()
  })

  this.parser.on('error', this.emit.bind(this, 'error'))
}

inherits(StreamParser, EventEmitter)

/*
 * hack for most usecases, do we have a better idea?
 *   catch the following:
 *   <?xml version="1.0"?>
 *   <?xml version="1.0" encoding="UTF-8"?>
 *   <?xml version="1.0" encoding="UTF-16" standalone="yes"?>
 */
StreamParser.prototype.checkXMLHeader = function (data) {
  // check for xml tag
  var index = data.indexOf('<?xml')

  if (index !== -1) {
    var end = data.indexOf('?>')
    if (index >= 0 && end >= 0 && index < end + 2) {
      var search = data.substring(index, end + 2)
      data = data.replace(search, '')
    }
  }

  return data
}

StreamParser.prototype.write = function (data) {
  // if (/^<stream:stream [^>]+\/>$/.test(data)) {
  //   data = data.replace(/\/>$/, ">")
  // }
  if (this.parser) {
    data = data.toString('utf8')
    data = this.checkXMLHeader(data)

    /* If a maxStanzaSize is configured, the current stanza must consist only of this many bytes */
    if (this.bytesParsedOnStanzaBegin && this.maxStanzaSize &&
      this.bytesParsed > this.bytesParsedOnStanzaBegin + this.maxStanzaSize) {
      this.error('policy-violation', 'Maximum stanza size exceeded')
      return
    }
    this.bytesParsed += data.length

    this.parser.write(data)
  }
}

StreamParser.prototype.end = function (data) {
  if (data) {
    this.write(data)
  }
  /* Get GC'ed */
  delete this.parser
  this.emit('end')
}

StreamParser.prototype.error = function (condition, message) {
  var e = new Error(message)
  e.condition = condition
  this.emit('error', e)
}

module.exports = StreamParser
