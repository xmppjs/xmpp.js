'use strict'

const test = require('ava')
const JID = require('../lib/JID')

test('throws TypeError for invalid domain', t => {
  t.throws(() => new JID('foo'), TypeError)

  t.throws(() => new JID(), TypeError)

  t.throws(() => new JID('foo', '', 'r'), TypeError)

  t.throws(() => new JID('foo', '', 'r'), TypeError)
})
