'use strict'

const TimeoutError = require('./TimeoutError')
const delay = require('./delay')

module.exports = function timeout(promise, ms) {
  const promiseDelay = delay(ms)

  // eslint-disable-next-line unicorn/consistent-function-scoping
  function cancelDelay() {
    clearTimeout(promiseDelay.timeout)
  }

  return Promise.race([
    promise.finally(cancelDelay),
    promiseDelay.then(() => {
      throw new TimeoutError()
    }),
  ])
}
