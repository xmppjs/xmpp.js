'use strict';

var assert = require('assert')
  , http = require('http')
  , xmpp = require('./../index')
  , C2SStream = require('node-xmpp-server/lib/c2s/stream')

var BOSH_PORT = 45580

describe('BOSH client/server', function() {

    describe('client', function() {
        var sv = new xmpp.BOSHServer()
        var svcl, c2s
        http.createServer(function(req, res) {
            sv.handleHTTP(req, res)
        }).listen(BOSH_PORT)

        sv.on('connect', function(svcl_) {
            svcl = svcl_
            c2s = new C2SStream({ connection: svcl })
            c2s.on('authenticate', function(opts, cb) {
                cb()
            })
        })

        var cl
        it('should go online', function(done) {
            cl = new xmpp.Client({
                jid: 'test@example.com',
                password: 'test',
                boshURL: 'http://localhost:' + BOSH_PORT
            })
            cl.on('online', function() {
                assert.ok(
                    c2s.authenticated,
                    'Client should have authenticated'
                )
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
            var stanza = new xmpp.Message({ to: 'foo@bar.org' })
                .c('body')
                .t('Hello')
            cl.send(stanza)
        })

        it('should receive a stanza', function(done) {
            cl.once('stanza', function(stanza) {
                assert.ok(stanza.is('message'), 'Message stanza')
                assert.equal(stanza.attrs.to, 'bar@bar.org')
                assert.equal(stanza.getChildText('body'), 'Hello back')
                done()
            })
            svcl.send(new xmpp.Message({ to: 'bar@bar.org' }).
                  c('body').t('Hello back'))
        })
    })

})
