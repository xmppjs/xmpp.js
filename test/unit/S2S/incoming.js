/* eslint-env mocha */

'use strict'

var IncomingServer = require('../../../lib/S2S/session/incoming')
var sinon = require('sinon')

describe('S2S IncomingServer', function () {
  describe('sendFeatures', function () {
    var streamFeaturesNoSASL = '<stream:features><bind/><session/></stream:features>'

    var streamFeaturesSASL = '<stream:features><bind/><session/><mechanisms xmlns="urn:ietf:params:xml:ns:xmpp-sasl"><mechanism>EXTERNAL</mechanism></mechanisms></stream:features>'

    it('should offer SASL EXTERNAL mechanism if connection is secured and secureDomain is true', function () {
      var server = new IncomingServer()
      var sendStub = sinon.stub(server, 'send')

      server.secureDomain = true
      server.isSecure = true

      server.sendFeatures()

      sinon.assert.calledWith(sendStub, sinon.match(function (features) {
        return features.toString() === streamFeaturesSASL
      }))
    })

    it('should not offer SASL EXTERNAL mechanism if connection is not secured and secureDomain is true', function () {
      var server = new IncomingServer()
      var sendStub = sinon.stub(server, 'send')

      server.secureDomain = true
      server.isSecure = undefined

      server.sendFeatures()

      sinon.assert.calledWith(sendStub, sinon.match(function (features) {
        return features.toString() === streamFeaturesNoSASL
      }))
    })

    it('should not offer SASL EXTERNAL mechanism if connection is secured and secureDomain is not set', function () {
      var server = new IncomingServer()
      var sendStub = sinon.stub(server, 'send')

      server.secureDomain = undefined
      server.isSecure = true

      server.sendFeatures()

      sinon.assert.calledWith(sendStub, sinon.match(function (features) {
        return features.toString() === streamFeaturesNoSASL
      }))
    })
  })

  it('should not sendFeatures immediately after connect', function () {
    var server = new IncomingServer()
    var sendFeaturesSpy = sinon.spy(server, 'sendFeatures')
    var fakeSocket = {
      on: sinon.stub().returnsThis(),
      once: sinon.stub().returnsThis(),
      emit: sinon.stub().returnsThis(),
      end: sinon.stub(),
      setKeepAlive: sinon.stub()
    }
    server.emit('connect', fakeSocket)
    sinon.assert.notCalled(sendFeaturesSpy)
  })
})
