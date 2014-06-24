'use strict';

var Component = require('../../index')
  , ltx = require('node-xmpp-core').ltx

var C2S_PORT = 8889
var COMPONENT_PORT = 8888
    
require('should')

var component = null
  , client = null

var options = {
    jid: 'component.localhost',
    password: 'mysecretcomponentpassword',
    host: 'localhost',
    port: COMPONENT_PORT
}

/* jshint -W030 */
describe('Integration tests', function() {

    before(function(done) {
        client = new Client({
            jid: 'test@localhost',
            host: 'localhost',
            password: 'password',
            port: C2S_PORT,
            register: true
        })
        client.on('online', function() {
            done()
        })
    })

    it('Can connect and send a message', function(done) {
        var component = new Component(options)
        component.on('online', function(data) {
            data.should.exist
            var stanza = new ltx.Element(
                'message',
                { to: 'test@localhost', type: 'chat' }
            ).c('body').text('Hello little miss client!')
            
            client.on('stanza', function(stanza) {
                stanza.is('message').should.be.true
                stanza.attrs.from.should.equal('component.localhost')
                stanza.attrs.type.should.equal('chat')
                stanza.getChildText('body').should.equal('Hello little miss client!')
                done()
            })
            component.send(stanza)
        })
        component.should.exist    
    })
    
})
