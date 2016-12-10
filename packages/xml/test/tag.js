/* global describe, it */

'use strict'

var assert = require('assert')
var xml = require('..')
var tag = require('../lib/tag')
var Stanza = require('../lib/Stanza')

describe('tag', function () {
  it('exported correctly', function () {
    assert.equal(xml.tag, tag)
  })

  it('parses the stanza and return a Stanza object', function () {
    const stanza = tag`<message/>`
    assert(stanza instanceof Stanza)
  })
})
