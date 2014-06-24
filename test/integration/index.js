'use strict';

var Component = require('../../index')
  , ltx = require('node-xmpp-core').ltx
  , Client = require('node-xmpp-client')
    
require('should')

var component = null
  , client = null
  , user = (+new Date()).toString(36)

var options = {
    jid: 'component.localhost',
    password: 'mysecretcomponentpassword',
    host: 'localhost',
    port: 5347
}

/* jshint -W030 */
describe('Integration tests', function() {

    before(function(done) {
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
    
    after(function() {
        if (client) client.emit('close')
        if (component) component.emit('close')
    })

    it('Can connect and send a message', function(done) {
        component = new Component(options)
        component.on('online', function() {
            var outgoing = new ltx.Element(
                'message',
                { to: user + '@localhost', type: 'chat', from: 'component.localhost' }
            )
            outgoing.c('body').t('Hello little miss client!')
            
            client.on('stanza', function(stanza) {
                stanza.is('message').should.be.true
                stanza.attrs.from.should.equal('component.localhost')
                stanza.attrs.type.should.equal('chat')
                stanza.getChildText('body').should.equal('Hello little miss client!')
                done()
            })
            component.send(outgoing)
        })
        component.on('error', function(error) {
            done(error)
        })
        component.should.exist
    })
    
   // it('Can receive a message', function(done) {
        
   // })
    
})
