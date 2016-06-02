/* global describe, it */

'use strict'

var DigestMD5 = require('../../lib/authentication/digestmd5')

var mech = new DigestMD5()

require('should')

describe('Digest-md5 authentication', function () {
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
