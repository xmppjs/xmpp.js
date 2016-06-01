'use strict'

var xmpp = require('../index')
var server = null
var Component = require('node-xmpp-component')

var startServer = function (done) {
  // Sets up the server.
  server = new xmpp.ComponentServer({
    port: 5347
  })
  server.on('connect', function (component) {
    // Component auth is two step:
    // first, verify that the component is allowed to connect at all,
    // then verify the password is correct
    component.on('verify-component', function (jid, cb) {
      if (jid.toString() === 'component.example.com') {
        return cb(null, 'ThePassword')
      }
      return cb('Unauthorized')
    })
    component.on('online', function () {
      console.log('ONLINE')
    })
    component.on('stanza', function (stanza) {
      console.log('STANZA', stanza.root().toString())
      // Here you could, for example, dispatch this to an existing C2S Server
      var from = stanza.attrs.from
      stanza.attrs.from = stanza.attrs.to
      stanza.attrs.to = from
      component.send(stanza)
    })
    component.on('disconnect', function () {
      console.log('DISCONNECT')
    })
  })

  server.on('listening', done)
}

startServer(function () {
  var component = new Component({
    jid: 'component.example.com',
    host: 'localhost',
    port: 5347,
    password: 'ThePassword'
  })
  component.on('online', function () {
    console.log('component is online')

    var stanza = new xmpp.Stanza('message', {
      to: 'testguy@example.com',
      from: 'fake@example.com'
    }).c('body').t('HelloWorld')

    component.send(stanza)
  })
  component.on('stanza', function (stanza) {
    console.log('component', 'received stanza', stanza.root().toString())
  })
})
