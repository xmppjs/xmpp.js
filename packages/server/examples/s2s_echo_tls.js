'use strict'

const xmpp = require('../index')
const ltx = require('node-xmpp-core').ltx
const pem = require('pem')

const r = new xmpp.Router()

let rawmsg = "<message to='mu@example.com' from='juliet@nodexmpp.com/balcony' "
rawmsg += "type='chat' xml:lang='en'><body>Wherefore art thou, mu?</body></message>"

pem.createCertificate({
  days: 100,
  selfSigned: true,
  organization: 'nodexmpp',
  organizationUnit: 'development',
  commonName: 'nodexmpp',

}, (error, keys) => {
  if (error) {
    console.error(error)
  } else {
    r.loadCredentials(
      'nodexmpp.com',
      keys.serviceKey,
      keys.certificate)

    r.register('nodexmpp.com', (stanza) => {
      console.log('GOT YA << ' + stanza.toString())
      if (stanza.attrs.type !== 'error') {
        const me = stanza.attrs.to
        stanza.attrs.to = stanza.attrs.from
        stanza.attrs.from = me
        r.send(stanza)
      }
    })

    const msg = ltx.parse(rawmsg)
    r.send(msg)
  }
})
