'use strict'

var XMPP = require('../index')

var prebind = new XMPP({
  jid: 'me@example.com',
  password: 'secret',
  preferred: 'PLAIN',
  bosh: {
    url: 'http://example.com/http-bind',
    wait: 60,
    prebind: function (error, data) {
      if (error) throw new Error(error)
      return data
    /*
        data.sid
        data.rid
     */
    }
  }
})

prebind.on('online', function () { console.log('Connected') })
