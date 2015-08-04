'use strict'

var xmpp = require('../index')
  , assert = require('assert')
  , Component = require('../lib/xmpp').component
  , Message = require('../lib/xmpp').core.Stanza.Message

var eventChain = []
var server = null

function startServer(done) {

    // Sets up the server.
    server = new xmpp.ComponentServer({
        port: 5347
    })

    server.on('error', function(err) {
        console.log('server error: ' + err.message)
    })

    server.on('connect', function(component) {
        // allow anything
        component.on('verify-component', function(jid, cb) {
            eventChain.push('verify-component')
            cb(null, 'alice')
        })

        component.on('online', function() {
            eventChain.push('online')
        })

        component.on('stanza', function() {
            eventChain.push('stanza')
            component.send(
                new Message({ type: 'chat' })
                    .c('body')
                .t('Hello there, little component.')
            )
        })

        component.on('disconnect', function() {
            eventChain.push('disconnect')
        })

        component.on('end', function() {
            eventChain.push('end')
        })

        component.on('close', function() {
            eventChain.push('close')
        })

        component.on('error', function() {
            eventChain.push('error')
        })
    })
    done()
}

describe('ComponentServer', function() {

    var component = null

    before(function(done) {
        startServer(done)
    })

    after(function(done) {
        server.shutdown(done)
    })

    describe('events', function() {
        it('should be in the right order for connecting', function(done) {
            eventChain = []

            //componentCallback = done
            component = new Component({
                jid: 'bob.example.com',
                password: 'alice',
                host: 'localhost',
                port: 5347
            })
            component.on('online', function() {
                eventChain.push('componentonline')
                assert.deepEqual(eventChain, ['verify-component', 'online', 'componentonline'])
                done()
            })
            component.on('error', function(e) {
                done(e)
            })

        })

        it('should ping pong stanza', function(done) {
            eventChain = []

            component.on('stanza', function() {
                eventChain.push('componentstanza')
                assert.deepEqual(eventChain, ['stanza', 'componentstanza'])
                done()
            })

            component.send(
                new Message({ type: 'chat' })
                    .c('body')
                    .t('Hello there, little server.')
            )

            component.on('error', function(e) {
                done(e)
            })
        })

        it('should close the connection', function(done) {
            eventChain = []

            // end xmpp stream
            component.on('end', function() {
                eventChain.push('componentend')
            })

            // close socket
            component.on('close', function() {
                eventChain.push('componentclose')
                // FIXME 2 disconnect events
                assert.deepEqual(eventChain, ['disconnect', 'end', 'disconnect', 'close', 'componentend', 'componentclose'])
                done()
            })

            component.end()
        })

    })

})
