'use strict';

var Session = require('../../lib/session')

require('should')

describe('Session', function() {
    var session
    
    describe('Socket legacy SSL connection', function() {
        it('should handshake with GCM', function(done) {
            session = new Session({
                jid: {
                    domain: 'gcm.googleapis.com'
                },
                port: 5235,
                host: 'gcm.googleapis.com',
                legacySSL: true
            })
            
            session.on('connect', function() {
                done()
            })
            
            session.on('error', function(e) {
                done(e)
            })
        });
    })
})
