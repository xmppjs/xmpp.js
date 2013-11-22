'use strict';

var util = require('util')
  , EventEmitter = require('events').EventEmitter
  , ltx = require('ltx')
  , Stanza = require('./stanza').Stanza

/**
 * Recognizes <stream:stream> and collects stanzas used for ordinary
 * TCP streams and Websockets.
 *
 * API: write(data) & end(data)
 * Events: streamStart, stanza, end, error
 */
function StreamParser(maxStanzaSize) {
    EventEmitter.call(this)

    var self = this
    this.parser = new ltx.bestSaxParser()

    /* Count traffic for entire life-time */
    this.bytesParsed = 0
    this.maxStanzaSize = maxStanzaSize
    /* Will be reset upon first stanza, but enforce maxStanzaSize until it is parsed */
    this.bytesParsedOnStanzaBegin = 0

    this.parser.addListener(
        'startElement',
        function(name, attrs) {
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
                    child = new ltx.Element(name, attrs)
                    self.element = self.element.cnode(child)
                }
            }
        }
    )

    this.parser.addListener('endElement', function(name) {
        if (!self.element && (name === 'stream:stream')) {
            self.end()
        } else if (self.element && (name === self.element.name)) {
            if (self.element.parent) {
                self.element = self.element.parent
            } else {
                /* Stanza complete */
                self.emit('stanza', self.element)
                delete self.element
                /* maxStanzaSize doesn't apply until next startElement */
                delete self.bytesParsedOnStanzaBegin
            }
        } else {
            self.error('xml-not-well-formed', 'XML parse error')
        }
    })

    this.parser.addListener('text', function(str) {
        if (self.element)
            self.element.t(str)
    })

    this.parser.addListener('entityDecl', function() {
        /* Entity declarations are forbidden in XMPP. We must abort to
         * avoid a billion laughs.
         */
        self.error('xml-not-well-formed', 'No entity declarations allowed')
        self.end()
    })

    this.parser.addListener('error', function(error) {
        self.emit('error', error)
    })
}

util.inherits(StreamParser, EventEmitter)

StreamParser.prototype.write = function(data) {
    /*if (/^<stream:stream [^>]+\/>$/.test(data)) {
    data = data.replace(/\/>$/, ">")
    }*/
    if (this.parser) {
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

StreamParser.prototype.end = function(data) {
    if (data) {
        this.write(data)
    }

    delete this.parser
    this.emit('end')
}

StreamParser.prototype.error = function(condition, message) {
    var e = new Error(message)
    e.condition = condition
    this.emit('error', e)
}

exports.StreamParser = StreamParser