/* global describe, it */

'use strict'

var assert = require('assert')
var stanza = require('../index')
var Stanza = stanza.Stanza
var Presence = stanza.Presence

describe('Presence', function () {
  it('is an instanceof Stanza', function () {
    var s = new Presence()
    assert(s instanceof Stanza)
  })

  it('has "presence" as node name', function () {
    var s = new Presence()
    assert(s.is('presence'))
    assert.equal(s.name, 'presence')
  })

  it('passes attrs argument down to Stanza', function () {
    var s = new Presence({foo: 'bar'})
    assert.equal(s.attrs.foo, 'bar')
  })
})
