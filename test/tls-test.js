'use strict';

var xmpp = require('../lib/node-xmpp');

var user = {
	jid: 'me@localhost',
	password: 'secret'
};

function startServer() {
	// Sets up the server.
	var c2s = new xmpp.C2SServer({
		port: 5222,
		domain: 'localhost',
		tls: {
			keyPath: './files/key.pem',
			certPath: './files/cert.pem'
		}
	});

	c2s.on('connect', function(client) {

		// Allows the developer to authenticate users against anything they want.
		client.on('authenticate', function(opts, cb) {
			/*jshint camelcase: false */
			if ((opts.saslmech = 'PLAIN') &&
				(opts.jid.toString() === user.jid) &&
				(opts.password === user.password)) {
				cb(false)
			} else {
				cb(new Error('Authentication failure'))
			}
		})

		client.on('online', function() {
			client.send(new xmpp.Message({
				type: 'chat'
			}).c('body').t('Hello there, little client.'))
		});
	});

	return c2s;
}


describe('JID', function() {

	before(function(done) {
		startServer()
		done()
	});

	describe('server', function() {
		it('should accept plain authentication', function(done) {
			var cl = new xmpp.Client({
				jid: user.jid,
				password: user.password
			});
			cl.on('online', function() {
				done();
			});
			cl.on('error', function(e) {
				done(e);
			});

		});
		it('should not accept plain authentication', function(done) {
			var cl = new xmpp.Client({
				jid: user.jid,
				password: user.password + 'abc'
			});

			cl.on('online', function() {
				done(new Error('should not allow any authentication'));
			});
			cl.on('error', function() {
				done();
			});

		});
	});
});