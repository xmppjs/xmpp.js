'use strict'

const test = require('ava')
const parse = require('../lib/parse')

test('should parse a "domain" JID', t => {
  const j = parse('d')
  t.is(j.getLocal(), '')
  t.is(j.getDomain(), 'd')
  t.is(j.getResource(), '')
})

test('should parse a "user@domain" JID', t => {
  const j = parse('u@d')
  t.is(j.getLocal(), 'u')
  t.is(j.getDomain(), 'd')
  t.is(j.getResource(), '')
})

test('should parse a "domain/resource" JID', t => {
  const j = parse('d/r')
  t.is(j.getLocal(), '')
  t.is(j.getDomain(), 'd')
  t.is(j.getResource(), 'r')
})

test('should parse a "user@domain/resource" JID', t => {
  const j = parse('u@d/r')
  t.is(j.getLocal(), 'u')
  t.is(j.getDomain(), 'd')
  t.is(j.getResource(), 'r')
})

test('should parse a "user@domain/resource@thing" JID', t => {
  const j = parse('u@d/r@foo')
  t.is(j.getLocal(), 'u')
  t.is(j.getDomain(), 'd')
  t.is(j.getResource(), 'r@foo')
})

test('should parse a "user@domain/resource/thing" JID', t => {
  const j = parse('u@d/r/foo')
  t.is(j.getLocal(), 'u')
  t.is(j.getDomain(), 'd')
  t.is(j.getResource(), 'r/foo')
})

test('should parse an internationalized domain name as unicode', t => {
  const j = parse('öko.de')
  t.is(j.getDomain(), 'öko.de')
})

test('should parse an empty domain JID (#109)', t => {
  const j = parse('u@d', '')
  t.is(j.getLocal(), 'u')
  t.is(j.getDomain(), 'd')
  t.is(j.getResource(), '')
})

test('should allow access to jid parts using keys', t => {
  const j = parse('u@d/r', '')
  t.is(j.local, 'u')
  t.is(j.domain, 'd')
  t.is(j.resource, 'r')
})

test("shouldn't get U_STRINGPREP_PROHIBITED_ERROR (#93)", t => {
  t.notThrows(() => {
    const j = parse('f u@d')
    j.toString()
  })
})
