'use strict'

var XOAuth2 = require('../../../../lib/authentication/xoauth2')

var mech = new XOAuth2()

require('should')

/* jshint -W030 */
/* jshint -W106 */
describe('XOAuth2 authentication', function() {

    describe('Detect SASL mechanisms', function() {

        it('Should return false if \'oauth2_auth\' property doesn\'t exist', function() {
            var options = {}
            mech.match(options).should.equal(false)
        })

        it('Should return false if \'oauth2_auth\' does not have correct value', function() {
            var options = {
                /* eslint-disable camelcase */
                oauth2_auth: 'oauth2_auth'
                /* eslint-enable camelcase */
            }
            mech.match(options).should.equal(false)
        })

        it('Should return true if \'oauth2_auth\' has correct value', function() {
            var options = {
                /* eslint-disable camelcase */
                oauth2_auth: mech.NS_GOOGLE_AUTH
                /* eslint-enable camelcase */
            }
            mech.match(options).should.equal(true)
        })

    })

})
