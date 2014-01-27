'use strict';

var proxyquire = require('proxyquire')
  , ltx = require('ltx')

require('should')

/* jshint -W030 */
describe('Connects as expected', function() {

    var Component = proxyquire('../index', {
        'node-xmpp-core': {
            Connection: require('./utils/connection')
        }
    })

    var options = {
        jid: 'component.shakespeare.lit',
        host: 'localhost',
        password: 'password',
        port: 5347
    }

    it('Sends opening <stream/>', function(done) {
        var component = new Component(options)
        var openStream = ltx.parse(component.connection.getLastSent() + '</stream:stream>')
        openStream.is('stream').should.be.true
        openStream.attrs.xmlns.should.equal(component.NS_COMPONENT)
        openStream.attrs.to.should.equal(options.jid)
        done()
    })

})