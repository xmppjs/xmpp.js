'use strict'

const xmpp = require('../index')
const ltx = require('node-xmpp-core').ltx

const r = new xmpp.Router()

let rawmsg = "<message to='mu@example.com' from='juliet@nodexmpp.com/balcony' "
rawmsg += "type='chat' xml:lang='en'><body>Wherefore art thou, mu?</body></message>"

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
