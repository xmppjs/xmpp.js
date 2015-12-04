/* global describe, it */

'use strict'

var Anonymous = require('../../../../lib/authentication/anonymous')

var mech = new Anonymous()

require('should')

describe('Anonymous authentication', function () {
  describe('Detect SASL mechanisms', function () {
    it('Should return true', function () {
      var options = {}
      mech.match(options).should.equal(true)
    })
  })
})
