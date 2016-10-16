/* global describe, it */

'use strict'

var assert = require('assert')
var spy = require('sinon').spy
var index = require('../index')
var JID = require('../lib/JID')
var tag = require('../lib/tag')

describe('index', function () {
  describe('is', function () {
    it('returns true if the passed argument is an instance of JID', function () {
      var addr = new JID('foo')
      assert.strictEqual(index.is(addr), true)
    })

    it('returns false if the passed argument is not an instance of JID', function () {
      var addr = function () {}
      assert.strictEqual(index.is(addr), false)
    })
  })

  describe('equal', function () {
    it('calls equals on the first argument with the second argument', function () {
      var A = new JID('foo')
      var B = new JID('bar')
      spy(A, 'equals')
      index.equal(A, B)
      assert(A.equals.calledWith(B))
      A.equals.restore()
    })
  })

  describe('tag', function () {
    it('exports lib/tag', function () {
      assert.strictEqual(index.tag, tag)
    })
  })

  describe('JID', function () {
    it('exports lib/JID', function () {
      assert.strictEqual(index.JID, JID)
    })
  })

  describe('default', function () {
    it('calls tag with passed arguments if the first argument is an array', function () {
      // var addr = tag`${'local'}@${'domain'}/${'resource'}`
      var addr = index(['foo', ''], 'bar', 'baz')
      assert(addr instanceof JID)
      assert.strictEqual(addr.toString(), 'foobarbaz')
    })

    it('calls JId with passed arguments', function () {
      var addr = index('foo', 'bar', 'baz')
      assert(addr instanceof JID)
      assert.strictEqual(addr.toString(), 'foo@bar/baz')
    })

    it('works as expected with new operator', function () {
      var addr = new index('foo', 'bar', 'baz') // eslint-disable-line
      assert(addr instanceof JID)
      assert.strictEqual(addr.toString(), 'foo@bar/baz')
    })
  })
})
