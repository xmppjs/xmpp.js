var vows = require('vows'),
assert = require('assert'),
xmpp = require('./../lib/xmpp');

// Create a Test Suite
vows.describe('JID').addBatch({

    'parsing': {
	'parse a "domain" JID':
	function() {
	    var j = new xmpp.JID('d');
	    assert.equal(j.user, null);
	    assert.equal(j.domain, 'd');
	    assert.equal(j.resource, null);
	},
	'parse a "user@domain" JID':
	function() {
	    var j = new xmpp.JID('u@d');
	    assert.equal(j.user, 'u');
	    assert.equal(j.domain, 'd');
	    assert.equal(j.resource, null);
	},
	'parse a "domain/resource" JID':
	function() {
	    var j = new xmpp.JID('d/r');
	    assert.equal(j.user, null);
	    assert.equal(j.domain, 'd');
	    assert.equal(j.resource, 'r');
	},
	'parse a "user@domain/resource" JID':
	function() {
	    var j = new xmpp.JID('u@d/r');
	    assert.equal(j.user, 'u');
	    assert.equal(j.domain, 'd');
	    assert.equal(j.resource, 'r');
	}
    },

    'serialization': {
	'serialize a "domain" JID':
	function() {
	    var j = new xmpp.JID(null, 'd');
	    assert.equal(j.toString(), 'd');
	},
	'serialize a "user@domain" JID':
	function() {
	    var j = new xmpp.JID('u', 'd');
	    assert.equal(j.toString(), 'u@d');
	},
	'serialize a "domain/resource" JID':
	function() {
	    var j = new xmpp.JID(null, 'd', 'r');
	    assert.equal(j.toString(), 'd/r');
	},
	'serialize a "user@domain/resource" JID':
	function() {
	    var j = new xmpp.JID('u', 'd', 'r');
	    assert.equal(j.toString(), 'u@d/r');
	}
    }

}).run();
