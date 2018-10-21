'use strict'

const {EventEmitter} = require('@xmpp/events')

class MockSocket extends EventEmitter {
  write(data, cb) {
    cb()
  }
}

module.exports = function mockSocket() {
  return new MockSocket()
}
