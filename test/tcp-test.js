var vows = require('vows'),
assert = require('assert'),
xmpp = require('./../lib/xmpp');

const C2S_PORT = 45552;

vows.describe('JID').addBatch({

    'client': {
	topic: function() {
	    var sv = new xmpp.C2SServer({ port: C2S_PORT });
	    sv.on('connect', function(client) {
		console.log("sv client connect");
		client.on('all', function() {
		    console.log("sv client",arguments);
		});
		client.on('authenticate', function(opts, cb) {
		    cb();
		});
	    });
	    var cl = new xmpp.Client({ jid: 'test@example.com',
				       password: 'test',
				       host: '::1',
				       port: C2S_PORT });
	    var cb = this.callback;
	    cl.on('online', function() {
		console.log("online");
		cb();
	    });
	},
	'afterwards': function() {
	    console.log("afterwards",arguments);
	}
    }

}).export(module);
