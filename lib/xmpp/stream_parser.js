var util = require('util');
var EventEmitter = require('events').EventEmitter;
var expat = require('node-expat');
var ltx = require('ltx');
var Stanza = require('./stanza').Stanza;

function StreamParser(charset, maxStanzaSize) {
    EventEmitter.call(this);

    var self = this;
    this.parser = new expat.Parser(charset);
    this.maxStanzaSize = maxStanzaSize;
    this.bytesParsedOnStanzaBegin = 0;

    this.parser.addListener('startElement', function(name, attrs) {
        // TODO: refuse anything but <stream:stream>
        if (!self.element && name == 'stream:stream') {
            self.emit('start', attrs);
        } else {
	    var child;
            if (!self.element) {
                /* A new stanza */
		child = new Stanza(name, attrs);
                self.element = child;
                self.bytesParsedOnStanzaBegin = self.bytesParsed;
            } else {
                /* A child element of a stanza */
		child = new ltx.Element(name, attrs);
                self.element = self.element.cnode(child);
            }
        }
    });
    
    this.parser.addListener('endElement', function(name, attrs) {
        if (!self.element && name == 'stream:stream') {
            self.end();
        } else if (self.element && name == self.element.name) {
            if (self.element.parent)
                self.element = self.element.parent;
            else {
                /* Stanza complete */
                self.emit('stanza', self.element);
                delete self.element;
                delete self.bytesParsedOnStanzaBegin;
            }
        } else {
            self.error('xml-not-well-formed', 'XML parse error');
        }
    });
    
    this.parser.addListener('text', function(str) {
        if (self.element)
            self.element.t(str);
    });
    
    this.parser.addListener('entityDecl', function() {
	/* Entity declarations are forbidden in XMPP. We must abort to
	 * avoid a billion laughs.
	 */
	self.parser.stop();
	self.error('xml-not-well-formed', 'No entity declarations allowed');
	self.end();
    });
}
util.inherits(StreamParser, EventEmitter);
exports.StreamParser = StreamParser;

StreamParser.prototype.write = function(data) {
    if (this.parser) {
        if (this.bytesParsedOnStanzaBegin && this.maxStanzaSize &&
            this.bytesParsed > this.bytesParsedOnStanzaBegin + this.maxStanzaSize) {

            this.error('policy-violation', 'Maximum stanza size exceeded');
            return;
        }
        this.bytesParsed += data.length;

        if (!this.parser.parse(data, this.final ? true : false)) {
            this.error('xml-not-well-formed', 'XML parse error');
        }
    }
};

/* In case of connection restarts, we want no events from this parser anymore */
StreamParser.prototype.stop = function(data) {
    if(this.parser) {
        this.parser.stop();
    }
};

StreamParser.prototype.end = function(data) {
    if (data) {
        this.final = true;
        this.write(data);
    }

    delete this.parser;
    this.emit('end');
};

StreamParser.prototype.error = function(condition, message) {
    var e = new Error(message);
    e.condition = condition;
    this.emit('error', e);
};
