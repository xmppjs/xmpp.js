/* global describe, it */

'use strict'

var External = require('../../../../lib/authentication/external')

var mech = new External()

require('should')

describe('External authentication', function () {
  describe('Detect SASL mechanisms', function () {
    it("Should return true if 'credentials' property exists", function () {
      var options = { credentials: 'credentials' }
      mech.match(options).should.equal(true)
    })

    it("Should return false if 'credentials' property doesn't exist", function () {
      var options = {}
      mech.match(options).should.equal(false)
    })
  })
})
