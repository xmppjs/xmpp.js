var vows = require('vows'),
assert = require('assert'),
XML = require('./../lib/xmpp/xml');

vows.describe('XML').addBatch({
    'serialization': {
	'serialize an element': function() {
	    var e = new XML.Element('e');
	    assert.equal(e.toString(), '<e/>');
	},
	'serialize an element with attributes': function() {
	    var e = new XML.Element('e',
				    { a1: 'foo' });
	    assert.equal(e.toString(), '<e a1="foo"/>');
	},
	'serialize an element with attributes to entities': function() {
	    var e = new XML.Element('e',
				    { a1: '"well"' });
	    assert.equal(e.toString(), '<e a1="&quot;well&quot;"/>');
	},
	'serialize an element with text': function() {
	    var e = new XML.Element('e').t('bar').root();
	    assert.equal(e.toString(), '<e>bar</e>');
	},
	'serialize an element with text to entities': function() {
	    var e = new XML.Element('e').t('1 < 2').root();
	    assert.equal(e.toString(), '<e>1 &lt; 2</e>');
	},
    }
}).run();
