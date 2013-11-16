'use strict';

var pem = require('pem')
  , assert = require('assert')
  , xmpp = require('../lib/node-xmpp')

var user = {
    jid: 'me@localhost',
    password: 'secret'
}

var tls

before(function (done) {
    pem.createCertificate({days: 1, selfSigned: true}, function (err, keys) {
        if (err) return done(err)
        tls = { key: keys.serviceKey + '\n', cert: keys.certificate + '\n' }
        tls.ca = tls.cert
        done()
    })
})

var c2s = null

function startServer() {
    // Sets up the server.
    c2s = new xmpp.C2SServer({
        port: 5222,
        domain: 'localhost',
        requestCert: true,
        rejectUnauthorized: false,
        tls: tls
    })

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
            c2s.emit('test', client)
            client.send(new xmpp.Message({ type: 'chat' })
                .c('body')
                .t('Hello there, little client.')
            )
        })
    })

    return c2s
}


describe('TLS', function() {

    before(function(done) {
        startServer()
        done()
    })

    after(function(done) {
        c2s.shutdown()
        done()
    })
    describe('server', function() {

        it('should go online', function(done) {
            c2s.once('test', function(client) {
                assert.ok(
                    cl.connection.socket.authorized,
                    'Client should have working tls'
                )
                assert.ok(
                    client.connection.socket.authorized,
                    'Server should have working tls'
                )
                done()
            })
            var cl = new xmpp.Client({
                jid: user.jid,
                password: user.password,
                credentials: tls
            })
            cl.on('error', function(e) {
                done(e)
            })
        })

        it('should accept plain authentication', function(done) {
            var cl = new xmpp.Client({
                jid: user.jid,
                password: user.password
            })
            cl.on('online', function() {
                done()
            })
            cl.on('error', function(e) {
                done(e)
            })

        })

        it('should not accept plain authentication', function(done) {
            var cl = new xmpp.Client({
                jid: user.jid,
                password: user.password + 'abc'
            })

            cl.on('online', function() {
                done(new Error('should not allow any authentication'))
            })

            cl.on('error', function() {
                done()
            })

        })
    })

})