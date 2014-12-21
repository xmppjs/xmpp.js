'use strict';

var xmpp = require('../index')
  , assert = require('assert')
  , Component = require('node-xmpp-component')
  , Message = require('node-xmpp-core').Stanza.Message

var eventChain = []
var componentSrv = null

function startServer(done) {

    // Sets up the server.
    componentSrv = new xmpp.ComponentServer({
        port: 5347
    })

    componentSrv.on('error', function(err) {
        console.log('componentSrv error: ' + err.message)
    })

    componentSrv.on('connect', function(component) {
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

    var cl = null

    before(function(done) {
        startServer(done)
    })

    after(function(done) {
        componentSrv.shutdown(done)
    })

    describe('events', function() {
        it('should be in the right order for connecting', function(done) {
            eventChain = []

            //componentCallback = done
            cl = new Component({
                jid: 'bob.example.com',
                password: 'alice',
                host: 'localhost',
		port: 5347
            })
            cl.on('online', function() {
                eventChain.push('componentonline')
                assert.deepEqual(eventChain, ['verify-component', 'online', 'componentonline'])
                done()
            })
            cl.on('error', function(e) {
                done(e)
            })

        })

        it('should ping pong stanza', function(done) {
            eventChain = []

            cl.on('stanza', function() {
                eventChain.push('componentstanza')
                assert.deepEqual(eventChain, ['stanza', 'componentstanza'])
                done()
            })

            cl.send(
                new Message({ type: 'chat' })
                    .c('body')
                    .t('Hello there, little server.')
            )

            cl.on('error', function(e) {
                done(e)
            })
        })

        it('should close the connection', function(done) {
            eventChain = []

            // end xmpp stream
            cl.on('end', function() {
                eventChain.push('componentend')
            })

            // close socket
            cl.on('close', function() {
                eventChain.push('componentclose')
                assert.deepEqual(eventChain, ['end', 'disconnect', 'close', 'componentend', 'componentclose'])
                done()
            })

            cl.end()
        })

    })

})
