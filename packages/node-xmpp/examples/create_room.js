'use strict'

var xmpp = require('../index')
var argv = process.argv

if (argv.length < 5) {
  console.error('Usage: node create_room.js <my-jid> <my-password> <room-name>')
  process.exit(1)
}

var cl = new xmpp.Client({jid: argv[2], password: argv[3]})

cl.on('online', function (data) {
  var userJid = data.jid.user + '@' + data.jid.domain
  var roomJid = argv[4] + '@conference.' + data.jid.domain
  var pres
  var iq

  console.log('Connected as ' + userJid + '/' + data.jid.resource)

  console.log('Create room - ' + argv[4])

  pres = new xmpp.Element(
    'presence',
    { from: userJid, to: roomJid + '/' + data.jid.user })
    .c('x', {'xmlns': 'http://jabber.org/protocol/muc'})

  cl.send(pres.tree())

  iq = new xmpp.Element(
    'iq',
    { to: roomJid, type: 'set' })
    .c('query', { xmlns: 'http://jabber.org/protocol/muc#owner' })
    .c('x', { xmlns: 'jabber:x:data', type: 'submit' })

  // set room to be hidden by sending configuration. ref: http://xmpp.org/extensions/xep-0045.html
  iq.c('field', { 'var': 'FORM_TYPE' })
    .c('value').t('http://jabber.org/protocol/muc#roomconfig').up().up()
    .c('field', {'var': 'muc#roomconfig_publicroom'})
    .c('value').t('0').up().up()

  cl.send(iq.tree())

  // exit later for sending configuration done
  setTimeout(function () {
    cl.end()
  }, 100)
})

cl.on('error', function (e) {
  console.error(e)
  process.exit(1)
})
