'use strict'

const test = require('ava')
const JID = require('..').JID

test('should serialize a "domain" JID', t => {
  const j = new JID(null, 'd')
  t.is(j.toString(), 'd')
})

test('should serialize a "user@domain" JID', t => {
  const j = new JID('u', 'd')
  t.is(j.toString(), 'u@d')
})

test('should serialize a "domain/resource" JID', t => {
  const j = new JID(null, 'd', 'r')
  t.is(j.toString(), 'd/r')
})

test('should serialize a "user@domain/resource" JID', t => {
  const j = new JID('u', 'd', 'r')
  t.is(j.toString(), 'u@d/r')
})
