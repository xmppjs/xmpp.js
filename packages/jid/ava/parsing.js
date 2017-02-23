'use strict'

const test = require('ava')
const JID = require('..').JID

test('should parse a "domain" JID', t => {
  const j = new JID('d')
  t.is(j.getLocal(), null)
  t.is(j.getUser(), null) // DEPRECATED
  t.is(j.getDomain(), 'd')
  t.is(j.getResource(), null)
})

test('should parse a "user@domain" JID', t => {
  const j = new JID('u@d')
  t.is(j.getLocal(), 'u')
  t.is(j.getUser(), 'u') // DEPRECATED
  t.is(j.getDomain(), 'd')
  t.is(j.getResource(), null)
})

test('should parse a "domain/resource" JID', t => {
  const j = new JID('d/r')
  t.is(j.getLocal(), null)
  t.is(j.getUser(), null) // DEPRECATED
  t.is(j.getDomain(), 'd')
  t.is(j.getResource(), 'r')
})

test('should parse a "user@domain/resource" JID', t => {
  const j = new JID('u@d/r')
  t.is(j.getLocal(), 'u')
  t.is(j.getUser(), 'u') // DEPRECATED
  t.is(j.getDomain(), 'd')
  t.is(j.getResource(), 'r')
})

test('should parse a "user@domain/resource@thing" JID', t => {
  const j = new JID('u@d/r@foo')
  t.is(j.getLocal(), 'u')
  t.is(j.getUser(), 'u') // DEPRECATED
  t.is(j.getDomain(), 'd')
  t.is(j.getResource(), 'r@foo')
})

test('should parse a "user@domain/resource/thing" JID', t => {
  const j = new JID('u@d/r/foo')
  t.is(j.getLocal(), 'u')
  t.is(j.getUser(), 'u') // DEPRECATED
  t.is(j.getDomain(), 'd')
  t.is(j.getResource(), 'r/foo')
})

test('should parse an internationalized domain name as unicode', t => {
  const j = new JID('öko.de')
  t.is(j.getDomain(), 'öko.de')
})

test('should parse an empty domain JID (#109)', t => {
  const j = new JID('u@d', '')
  t.is(j.getLocal(), 'u')
  t.is(j.getUser(), 'u') // DEPRECATED
  t.is(j.getDomain(), 'd')
  t.is(j.getResource(), null)
})

test('should allow access to jid parts using keys', t => {
  const j = new JID('u@d/r', '')
  t.is(j.local, 'u')
  t.is(j.user, 'u') // DEPRECATED
  t.is(j.domain, 'd')
  t.is(j.resource, 'r')
})

test('shouldn\'t get U_STRINGPREP_PROHIBITED_ERROR (#93)', t => {
  t.notThrows(() => {
    const j = new JID('f u@d')
    j.toString()
  })
})
