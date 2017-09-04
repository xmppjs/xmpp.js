'use strict'

const TimeoutError = require('./TimeoutError')
const delay = require('./delay')

module.exports = function timeout(promise, ms) {
  return Promise.race([
    promise,
    delay(ms).then(() => {
      throw new TimeoutError()
    }),
  ])
}
