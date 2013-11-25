'use strict';

var assert = require('assert')
  , xmpp = require('./../lib/xmpp')

var C2S_PORT = 45552

describe('TCP client/server', function() {
    var sv = null

    after(function(done) {
        sv.shutdown()
        done()
    })

    describe('client', function() {

        sv = new xmpp.C2SServer({ port: C2S_PORT })
        var svcl
        sv.on('connect', function(svcl_) {
            svcl = svcl_
            // Always authenticate
            svcl.on('authenticate', function(opts, cb) {
                cb()
            })
        })
        var cl

        it('should go online', function(done) {
            cl = new xmpp.Client({
                jid: 'test@localhost',
                password: 'test',
                host: '::1',
                port: C2S_PORT
            })
            cl.on('online', function() {
                assert.ok(svcl.authenticated, 'Client should have authenticated')
                done()
            })
        })

        it('should send a stanza', function(done) {
            svcl.once('stanza', function(stanza) {
                assert.ok(stanza.is('message'), 'Message stanza')
                assert.equal(stanza.attrs.to, 'foo@bar.org')
                assert.equal(stanza.getChildText('body'), 'Hello')
                done()
            })
            cl.send(new xmpp.Message({ to: 'foo@bar.org' })
                .c('body')
                .t('Hello'))
        })
        it('should receive a stanza', function(done) {
            cl.once('stanza', function(stanza) {
                assert.ok(stanza.is('message'), 'Message stanza')
                assert.equal(stanza.attrs.to, 'bar@bar.org')
                assert.equal(stanza.getChildText('body'), 'Hello back')
                done()
            })
            svcl.send(new xmpp.Message({ to: 'bar@bar.org' })
                .c('body')
                .t('Hello back'))
        })

        it('Can send plain text stanza', function(done) {
            svcl.once('stanza', function(stanza) {
                assert.ok(stanza.is('message'), 'Message stanza')
                assert.equal(stanza.attrs.to, 'foo@bar.org')
                assert.equal(stanza.getChildText('body'), 'Hello')
                done()
            })
            cl.send('<message to="foo@bar.org"><body>Hello</body></message>')
        })

    })

})
