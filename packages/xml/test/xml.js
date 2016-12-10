/* global describe, it */

'use strict'

var xml = require('..')
var ltx = require('ltx')
var assert = require('assert')

describe('xml', function () {
  it('exports ltx', function () {
    assert.equal(xml.ltx, ltx)
  })

  it('exports ltx properties', function () {
    Object.keys(ltx).forEach((key) => {
      assert(key in xml)
    })
  })
})
