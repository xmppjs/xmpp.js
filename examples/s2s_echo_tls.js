'use strict'

var xmpp = require('../index')
var ltx = require('node-xmpp-core').ltx
var pem = require('pem')

var r = new xmpp.Router()

var rawmsg = "<message to='mu@example.com' from='juliet@nodexmpp.com/balcony' "
rawmsg = rawmsg + "type='chat' xml:lang='en'><body>Wherefore art thou, mu?</body></message>"

pem.createCertificate({
  days: 100,
  selfSigned: true,
  organization: 'nodexmpp',
  organizationUnit: 'development',
  commonName: 'nodexmpp'

}, function (error, keys) {
  if (error) {
    console.error(error)
  } else {
    r.loadCredentials(
      'nodexmpp.com',
      keys.serviceKey,
      keys.certificate)

    r.register('nodexmpp.com', function (stanza) {
      console.log('GOT YA << ' + stanza.toString())
      if (stanza.attrs.type !== 'error') {
        var me = stanza.attrs.to
        stanza.attrs.to = stanza.attrs.from
        stanza.attrs.from = me
        r.send(stanza)
      }
    })

    var msg = ltx.parse(rawmsg)
    r.send(msg)
  }
})
