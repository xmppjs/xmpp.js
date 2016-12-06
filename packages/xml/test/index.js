/* global describe, it, beforeEach */

'use strict'

var assert = require('assert')

describe('index', function () {
  var xml, ltx

  beforeEach(function () {
    xml = ltx = null
    delete require.cache[require.resolve('ltx')]
    delete require.cache[require.resolve('../index')]
  })

  it('does not leak ltx.tag for accidental mutation', function () {
    ltx = require('ltx')
    var keysBefore = Object.keys(ltx.tag)

    xml = require('../index')
    xml.foo = 'bar'
    var keysAfter = Object.keys(ltx.tag)
    assert(keysBefore.toString() === keysAfter.toString())
  })
})
