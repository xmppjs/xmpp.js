'use strict'

const test = require('ava')
const {match} = require('./index')

test('match', t => {
  t.is(match(<foo />), false)
  t.is(
    match(
      <foo>
        <session xmlns='urn:ietf:params:xml:ns:xmpp-session' />
      </foo>
    ),
    true
  )
  t.is(
    match(
      <foo>
        <session xmlns='urn:ietf:params:xml:ns:xmpp-session'>
          <optional />
        </session>
      </foo>
    ),
    false
  )
})
