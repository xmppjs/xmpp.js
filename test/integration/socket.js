'use strict';

var Client = require('../../index')
  , helper = require('../helper')

require('should')

/* jshint -W030 */
describe('Socket connections', function() {

    var jid = Math.random().toString(36).substring(7) + '@localhost'
    var password = 'password'
    var client = null
    
    beforeEach(function(done) {
        helper.startServer(done)
    })
    
    afterEach(function(done) {
        helper.stopServer(done)
        if (client) client.end()
    })
    
    it('Can register an account', function(done) {
        client = new Client({
            jid: jid,
            password: password,
            host: 'localhost',
            register: true
        })
        client.on('online', function() {
            done()
        })
    })
    
    

})