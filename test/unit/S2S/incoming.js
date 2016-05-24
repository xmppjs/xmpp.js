/* eslint-env mocha */

'use strict'

var IncomingServer = require('../../../lib/S2S/session/incoming')
var sinon = require('sinon')

describe('S2S IncomingServer', function () {
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
