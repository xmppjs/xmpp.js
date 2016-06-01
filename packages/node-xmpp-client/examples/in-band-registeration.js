'use strict'

var Client = require('node-xmpp-client')

// connect using the admin user's creds
var client = new Client({jid: 'admin@some.server.org', password: '1234'})

// check for errors on the socket
client.connection.socket.on('error', function (error) {
  console.error(error)
  process.exit(1)
})

client.on('online', function (data) {
  // stanza to be sent to the server
  var stanza = new Client.Stanza('iq', {type: 'set', id: 'reg1', to: 'some.server.org'})
   .c('query', {xmlns: 'jabber:iq:register'})
   .c('username').t('user').up()  // Give a username
   .c('password').t('1234')  // Give a password
  client.send(stanza) // send a stanza
})

// response stanzas
client.on('stanza', function (stanza) {
  if (stanza.attrs.type === 'error') {
    console.log('[error] ' + stanza)
    return
  }
  /*
  For ejabberd users:
    If you get error code 403
    change {access, register} to {access_from, register}
    and
    comment out the ip_access section in your ejabberdctl.cfg
  */
})

client.on('error', function (err) {
  console.error(err)
  process.exit(1)
})
