'use strict';

var XFacebookPlatform = require('../../../lib/authentication/xfacebook')
  , JID = require('node-xmpp-core').JID

var mech = new XFacebookPlatform()

require('should')

/* jshint -W030 */
describe('Facebook authentication', function() {

    describe('Detect SASL mechanisms', function() {

        it('Should return true if options.host = chat.facebook.com', function() {
            var options = { host: mech.facebookHost }
            mech.match(options).should.equal.true
        })

        it('Should return true if options.jid contains \'chat.facebook.com\'', function() {
            var options = { jid: new JID('lloyd@' + mech.facebookHost) }
            mech.match(options).should.equal.true
        })

        it('Should return false if neither situation is satisfied', function() {
            var options = {}
            mech.match(options).should.equal.false
            options = { host: 'buddycloud.org' }
            mech.match(options).should.equal.false
            options = { host: 'buddycloud.org', jid: new JID('lloyd@buddycloud.org') }
            mech.match(options).should.equal.false
        })

    })

})