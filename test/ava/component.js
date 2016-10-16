const test = require('ava')
const Component = require('../../packages/component')
const JID = require('../../packages/jid')

test('component', t => {
  t.plan(11)

  const component = new Component()

  component.on('connect', () => {
    t.pass('socket open')
  })

  component.on('open', ({name, attrs}) => {
    t.is(name, 'stream:stream')
    t.is(attrs['xml:lang'], 'en')
    t.is(attrs.from, 'component.localhost')
    t.is(typeof attrs.id, 'string')
    t.is(attrs.xmlns, 'jabber:component:accept')
  })

  component.on('authenticate', auth => {
    t.is(typeof auth, 'function')
    auth('mysecretcomponentpassword')
  })

  component.on('ready', () => {
    t.pass('ready')
  })

  component.on('online', (jid) => {
    t.true(jid instanceof JID.JID)
    t.is(jid.toString(), 'component.localhost')
  })

  return component.start('xmpp:component.localhost:5347')
    .then((jid) => {
      t.is(jid.toString(), 'component.localhost')
    })
    .catch(reason => {
      console.log(reason)
    })
})
