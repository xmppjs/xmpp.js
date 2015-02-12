'use strict';

var xmpp = require('../index')
  , componentSrv = null
  , debug = require('debug')('server-and-component')
  , Component = require('node-xmpp-component')
  , ltx = require('node-xmpp-core').ltx

var startServer = function(done) {
    // Sets up the server.
    componentSrv = new xmpp.ComponentServer({
        port: 5347
    })
    componentSrv.on('connect', function(client) {
	    // Component auth is two step:
        // first, verify that the component is allowed to connect at all,
        // then verify the password is correct
        client.on('verify-component', function(jid, cb) {
	    if (jid.toString() === 'component.example.com') {
		return cb(null, 'ThePassword')
            }
            return cb ('Unauthorized')
        })
        client.on('online', function() {
            debug('ONLINE')
        })
        client.on('stanza', function(stanza) {
            debug('STANZA', stanza.root().toString())
	    // Here you could, for example, dispatch this to an existing C2S Server
            var from = stanza.attrs.from
            stanza.attrs.from = stanza.attrs.to
            stanza.attrs.to = from
            client.send(stanza)
        })
        client.on('disconnect', function() {
           debug('DISCONNECT')
        })

    })

    if (done) done()
}

startServer(function() {
    var component1 = new Component({
        jid: 'component.example.com',
        host: 'localhost',
        port: 5347,
        password: 'ThePassword'
    })
    component1.on('online', function() {
        debug('component1 is online')
        component1
          .send(new ltx.Element('message', {
              to: 'testguy@example.com',
              from: 'fake@example.com'
          }
        ).c('body')
        .t('HelloWorld'))
    })
    component1.on('stanza', function(stanza) {
        debug('component1', 'received stanza', stanza.root().toString())
    })
})
