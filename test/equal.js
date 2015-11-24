/* global describe, it */

'use strict'

var assert = require('assert')
var stanza = require('../index')
var Stanza = stanza.Stanza
var equal = stanza.equal

// this is already tested in ltx
describe('equal', function () {
  it('returns true for equal stanzas', function () {
    var a = new Stanza('foo', {foo: 'bar'})
    var b = new Stanza('foo', {foo: 'bar'})
    assert.strictEqual(equal(a, b), true)
  })

  it('returns false for non equal stanzas', function () {
    var a = new Stanza('foo', {foo: 'bar'})
    var b = new Stanza('bar', {foo: 'bar'})
    assert.strictEqual(equal(a, b), false)
  })
})
