var vows = require('vows'),
assert = require('assert'),
http = require('http'),
xmpp = require('./../lib/xmpp');
C2SStream = require('./../lib/xmpp/c2s').C2SStream;

const BOSH_PORT = 45580;

vows.describe('BOSH client/server').addBatch({
    'client': {
	topic: function() {
	    var that = this;
	    this.sv = new xmpp.BOSHServer();
	    http.createServer(function(req, res) {
		that.sv.handleHTTP(req, res);
	    }).listen(BOSH_PORT);
	    this.sv.on('connect', function(svcl) {
		that.svcl = svcl;
		that.c2s = new C2SStream(svcl);
		that.c2s.on('authenticate', function(opts, cb) {
		    cb();
		});
	    });
	    this.cl = new xmpp.Client({
		jid: 'test@example.com',
		password: 'test',
		boshURL: "http://localhost:" + BOSH_PORT
	    });
	    var cb = this.callback;
	    this.cl.on('online', function() {
		cb();
	    });
	},
	"logged in": function() {},
	'can send stanzas': {
	    topic: function() {
		var cb = this.callback;
		this.svcl.once('stanza', function(stanza) {
		    cb(null, stanza);
		});
		this.cl.send(new xmpp.Message({ to: "foo@bar.org" }).
			     c('body').t("Hello"));
	    },
	    "received proper message": function(stanza) {
		assert.ok(stanza.is('message'), "Message stanza");
		assert.equal(stanza.attrs.to, "foo@bar.org");
		assert.equal(stanza.getChildText('body'), "Hello");
	    }
	},
	'can receive stanzas': {
	    topic: function() {
		var cb = this.callback;
		this.cl.once('stanza', function(stanza) {
		    cb(null, stanza);
		});
		this.svcl.send(new xmpp.Message({ to: "bar@bar.org" }).
			       c('body').t("Hello back"));
	    },
	    "received proper message": function(stanza) {
		assert.ok(stanza.is('message'), "Message stanza");
		assert.equal(stanza.attrs.to, "bar@bar.org");
		assert.equal(stanza.getChildText('body'), "Hello back");
	    }
	}
    },

    'client fails login': "pending",

    'auto reconnect': "pending"

}).export(module);
