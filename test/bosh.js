'use strict';

var assert = require('assert')
  , http = require('http')
  , xmpp = require('./../index')
  , C2SStream = require('../index').C2SStream
  , Client = require('node-xmpp-client')
  , Message = require('node-xmpp-core').Stanza.Message

var BOSH_PORT = 45580

describe('BOSH client/server', function() {
    var sv, svcl, c2s, cl, server;

    before(function(done) {
        sv = new xmpp.BOSHServer()
        server = http.createServer(function(req, res) {
            sv.handleHTTP(req, res)
        }).listen(BOSH_PORT)

        sv.on('connect', function(svcl_) {
            svcl = svcl_
            c2s = new C2SStream({ connection: svcl })
            c2s.on('authenticate', function(opts, cb) {
                cb(null, opts)
            })
        })
        done()
    })

    after(function(done) {
        console.log('Running after')
        c2s.end()
        server.close()
        done()
    })

    describe('client', function() {
        it('should go online', function(done) {
            cl = new Client({
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
            var stanza = new Message({ to: 'foo@bar.org' })
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
            svcl.send(new Message({ to: 'bar@bar.org' }).
                  c('body').t('Hello back'))
        })
    })

})
