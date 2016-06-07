/* global describe, it */

'use strict'

var assert = require('assert')
var JID = require('..')
var tag = require('../lib/tag')

describe('tag', function () {
  it('is exported correctly', function () {
    assert.equal(JID.tag, tag)
  })

  it('returns an instance of JID', function () {
    // var jid = tag`${'local'}@${'domain'}/${'resource'}`
    var jid = tag([ '', '@', '/', '' ], 'local', 'domain', 'resource')
    assert.equal(jid.local, 'local')
    assert.equal(jid.domain, 'domain')
    assert.equal(jid.resource, 'resource')
  })
})
