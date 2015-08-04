'use strict';

var Element = require('node-xmpp-core').Stanza.Element
  , C2SServer = require('../index').C2SServer
  , net = require('net')

require('should')

describe('Issues', function() {
    it('Shouldn\'t crash on invalid JID', function(done) {
        var Router = require('../index').Router
        var router = new Router()
        var message = new Element(
            'message', { to: 'foo@localhost', from: 'foo@localhost' }
        ).c('body').t('Hello')
        router.send(message)
        done()
    })
})

describe('Stream without proper "to" attribute', function() {
    function testEmptyTo(to) {
        var port = 5222
        var c2s
        var client

        var streamData = false
        var streamClosed = false
        var streamError = ''

        before(function(done) {
            c2s = new C2SServer({
                port: port,
                domain: 'localhost'
            })
            c2s.on('connect', function(stream) {
                stream.on('error', function(error) {
                    streamError = error
                })
            })
            c2s.on('online', function() {
                var stanza = '<?xml version="1.0"?>' +
                    '<stream:stream ' + to + ' xmlns="jabber:client" ' +
                    'xmlns:stream="http://etherx.jabber.org/streams" ' +
                    'version="1.0">'
                client = net.connect({port: port}, function() {
                    client.write(stanza)
                })
                client.on('data', function(data) {
                    if (/host-unknown/.test(data.toString())) {
                        streamData = true
                    }
                })

                client.on('end', function() {
                    streamClosed = true
                })
                done()
            })
        })

        after(function(done) {
            c2s.shutdown(done)
        })

        it('Should return error to client', function(done) {
            var end = new Date().getTime() + 2000
            var error = null
            while (streamData !== true) {
                if (new Date().getTime() >= end) {
                    error = 'Timeout'
                    break
                }
            }
            done(error)
        })

        it('Should close stream', function(done) {
            var end = new Date().getTime() + 2000
            var error = null
            while (streamClosed !== true) {
                if (new Date().getTime() >= end) {
                    error = 'Timeout'
                    break
                }
            }
            done(error)
        })

        it('Should generate error event on server', function(done) {
            streamError.should.match(/Empty domain/)
            done()
        })
    }

    describe('Handle stream with empty "to"', testEmptyTo.bind(undefined, 'to=""'))
    describe('Handle stream without "to"', testEmptyTo.bind(undefined, ''))
})
