'use strict';

var xmpp = require('../lib/node-xmpp'),
    assert = require('assert');

var eventChain = [];
var c2s = null;

function startServer() {

    // Sets up the server.
    c2s = new xmpp.C2SServer({
        port: 5222,
        domain: 'localhost'
    });

    c2s.on('error', function(err) {
        console.log('c2s error: ' + err.message);
    });

    c2s.on('connect', function(client) {
        c2s.on('register', function(opts, cb) {
            //console.log('register');
            cb(new Error('register not supported'));
        });

        // allow anything
        client.on('authenticate', function(opts, cb) {
            //console.log('authenticate');
            eventChain.push('authenticate');
            cb(null);
        });

        client.on('online', function() {
            //console.log('online');
            eventChain.push('online');
            //clientCallback();
        });

        client.on('stanza', function(stanza) {
            //console.log('stanza');
            eventChain.push('stanza');
            client.send(new xmpp.Message({
                type: 'chat'
            }).c('body').t('Hello there, little client.'));
        });

        client.on('disconnect', function(client) {
            eventChain.push('disconnect');
            //console.log('disconnect');
        });

        client.on('end', function() {
            eventChain.push('end');
            //console.log('end');
        });

        client.on('close', function() {
            eventChain.push('close');
            //console.log('close');
        });

        client.on('error', function(err) {
            eventChain.push('error');
            //console.log('error');
        });
    });
};

describe('C2Server', function() {

    var cl = null;
    var clientCallback = null;

    before(function(done) {
        startServer();
        done();
    });

    after(function(done) {
        c2s.shutdown();
        done();
    });

    describe('events', function() {
        it('should be in the right order for connecting', function(done) {
            eventChain = [];

            //clientCallback = done;
            cl = new xmpp.Client({
                jid: 'bob@example.com',
                password: 'alice',
                host: 'localhost'
            });
            cl.on('online', function() {
                eventChain.push('clientonline');
                assert.deepEqual(eventChain, ['authenticate', 'online', 'clientonline']);
                done();
            });
            cl.on('error', function(e) {
                done(e);
            });

        });
        it('should ping pong stanza', function(done) {
            eventChain = [];

            cl.on('stanza', function(stanza) {
                eventChain.push('clientstanza');
                assert.deepEqual(eventChain, ['stanza', 'clientstanza']);
                done();
            });

            cl.send(new xmpp.Message({
                type: 'chat'
            }).c('body').t('Hello there, little server.'));

            cl.on('error', function(e) {
                done(e);
            });
        });
        it('should close the connection', function(done) {
            eventChain = [];

            // end xmpp stream
            cl.on('end', function(e) {
                //console.log('clientend');
                eventChain.push('clientend');
            });

            // close socket
            cl.on('close', function(e) {
                //console.log('clientclose');
                eventChain.push('clientclose');
                assert.deepEqual(eventChain, ['end', 'close', 'clientend', 'clientclose']);
                done();
            });

            cl.end();
        });
    });
});