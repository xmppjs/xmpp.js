'use strict'

var xmpp = require('../index')

var cl = new xmpp.Client({ jid: 'julien@localhost', password: 'password' })

cl.on('online', function () {
  console.log('ONLINE!!! YIHAA')
})
