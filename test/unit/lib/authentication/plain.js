/* global describe, it */

'use strict'

var Plain = require('../../../../lib/authentication/plain')

var mech = new Plain()

require('should')

describe('Plain authentication', function () {
  describe('Detect SASL mechanisms', function () {
    it("Should return true if 'password' property exists", function () {
      var options = { password: 'abracadabra' }
      mech.match(options).should.equal(true)
    })

    it("Should return false if 'password' property doesn't exist", function () {
      var options = {}
      mech.match(options).should.equal(false)
    })
  })
})
