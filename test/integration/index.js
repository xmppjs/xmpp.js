'use strict';
/* jshint -W030 */

var Component = require('../../index')
  , ltx = require('node-xmpp-core').ltx
  , Client = require('node-xmpp-client')
  , exec = require('child_process').exec

require('should')

var component = null
  , client = null
  , user = null

var options = {}

var connectClients = function(done) {
    component = new Component(options)
    component.on('online', function() {
        var options = {
            jid: user + '@localhost',
            password: 'password',
            host: '127.0.0.1',
            register: true
        }
        client = new Client(options)
        client.on('online', function() {
            client.send(new ltx.Element('presence'))
            done()
        })
        client.on('error', function(error) {
            done(error)
        })
    })
}

describe('Integration tests', function() {

    beforeEach(function(done) {
        options = {
            jid: 'component.localhost',
            password: 'mysecretcomponentpassword',
            host: 'localhost',
            port: 5347
        }
        user = (+new Date()).toString(36)
        exec('sudo service prosody start', function() {
            setTimeout(function() {
                connectClients(done)
            }, 1000)
        })
    })
    
    afterEach(function() {
        if (client) client.end()
        if (component) component.end()
        component = null
        client = null
    })

    it('Can connect and send a message', function(done) {
        client.on('stanza', function(stanza) {
            if (false === stanza.is('message')) return
            stanza.is('message').should.be.true
            stanza.attrs.from.should.equal('component.localhost')
            stanza.attrs.to.should.equal(user + '@localhost')
            stanza.attrs.type.should.equal('chat')
            stanza.getChildText('body').should.equal('Hello little miss client!')
            done()
        })
        var outgoing = new ltx.Element(
            'message',
            {
                to: user + '@localhost',
                type: 'chat',
                from: 'component.localhost'
            }
        )
        outgoing.c('body').t('Hello little miss client!')
        component.send(outgoing)
    })
    
    it('Can receive a message', function(done) {
        component.on('stanza', function(stanza) {
            if (false === stanza.is('message')) return
            stanza.is('message').should.be.true
            stanza.attrs.to.should.equal('component.localhost')
            stanza.attrs.from.should.include(user + '@localhost')
            stanza.attrs.type.should.equal('chat')
            stanza.getChildText('body')
                .should.equal('Hello mr component!')
            done()
        })
        var outgoing = new ltx.Element(
            'message',
            {
                from: user + '@localhost',
                type: 'chat',
                to: 'component.localhost'
            }
        )
        outgoing.c('body').t('Hello mr component!')
        client.send(outgoing)
    })
    
    it('Errors if connecting with bad authentication information', function(done) {
        component.end()
        component = null
        options.password = 'incorrect'
        component = new Component(options)
        component.on('close', function() {
            done()
        })
        component.on('online', function() {
            done('Should not connect')
        })
    })
    
    it('Sends error when server stops', function(done) {
        client.end()
        component.on('error', function() {
            done()
        })
        component.on('close', function() {
            done()
        })
        exec('sudo service prosody stop', function() {})
    })
    
})
