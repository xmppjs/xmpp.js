'use strict';

var assert = require('assert'),
    xmpp = require('./../index'),
    Client = require('node-xmpp-client'),
    Message = require('node-xmpp-core').Stanza.Message,
    debug = require('debug')('xmpp:test:bosh')

var BOSH_PORT = 45580
var eventChain = []
var bosh = null

function startServer(done) {

    // Sets up the server.
    bosh = new xmpp.BOSHServer({
        port: BOSH_PORT,
        domain: 'localhost'
    })

    bosh.on('error', function (err) {
        console.log('c2s error: ' + err.message)
    })

    bosh.on('connect', function (client) {
        debug('connected bosh client')

        bosh.on('register', function (opts, cb) {
            cb(new Error('register not supported'))
        })

        // allow anything
        client.on('authenticate', function (opts, cb) {
            eventChain.push('authenticate')
            debug('server:authenticate')
            cb(null, opts)
        })

        client.on('online', function () {
            debug('client online')
            eventChain.push('online')
        })

        client.on('stanza', function (stanza) {
            debug('server:recieved stanza: ' + stanza.toString())
            eventChain.push('stanza')
            client.send(
                new Message({
                    type: 'chat'
                })
                .c('body')
                .t('Hello there, little client.')
            )
        })

        client.on('disconnect', function () {
            debug('server:disconnect')
            eventChain.push('disconnect')
        })

        client.on('end', function () {
            debug('server:end')
            eventChain.push('end')
        })

        client.on('close', function () {
            debug('server:close')
            eventChain.push('close')
        })

        client.on('error', function () {
            debug('server:error')
            eventChain.push('error')
        })
    })
    done()
}

describe('BOSH client/server', function () {
    var cl

    before(function (done) {
        startServer(done)
    })

    after(function (done) {
        bosh.shutdown(done)
    })

    describe('events', function () {
        it('should be in the right order for connecting', function (done) {
            eventChain = []

            //clientCallback = done
            cl = new Client({
                jid: 'bob@example.com',
                password: 'alice',
                bosh: {
                    url: 'http://127.0.0.1:' + BOSH_PORT
                }
            })
            cl.on('online', function () {
                eventChain.push('clientonline')
                assert.deepEqual(eventChain, ['authenticate', 'online', 'clientonline'])
                done()
            })
            cl.on('error', function (e) {
                done(e)
            })

        })

        it('should ping pong stanza', function (done) {
            eventChain = []

            cl.on('stanza', function () {
                eventChain.push('clientstanza')
                assert.deepEqual(eventChain, ['stanza', 'clientstanza'])
                done()
            })

            cl.send(
                new Message({
                    type: 'chat'
                })
                .c('body')
                .t('Hello there, little server.')
            )

            cl.on('error', function (e) {
                done(e)
            })
        })

        it('should close the connection', function (done) {
            eventChain = []

            // end xmpp stream
            cl.once('end', function () {
                eventChain.push('clientend')
            })

            // close socket
            cl.once('close', function () {
                eventChain.push('clientclose')
                assert.deepEqual(eventChain, ['end', 'disconnect', 'close', 'clientend', 'clientclose'])
                done()
            })

            cl.end()
        })

    })

})
