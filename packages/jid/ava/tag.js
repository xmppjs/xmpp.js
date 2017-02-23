'use strict'

const test = require('ava')
const JID = require('..')
const tag = require('../lib/tag')

test('is exported correctly', t => {
  t.is(JID.tag, tag)
})

test('returns an instance of JID', t => {
  // const jid = tag`${'local'}@${'domain'}/${'resource'}`
  const jid = tag([ '', '@', '/', '' ], 'local', 'domain', 'resource')
  t.is(jid.local, 'local')
  t.is(jid.domain, 'domain')
  t.is(jid.resource, 'resource')
})
