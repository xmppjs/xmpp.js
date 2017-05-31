'use strict'

const TimeoutError = require('./TimeoutError')

function to(ms) {
  return new Promise((resolve, reject) => setTimeout(() => reject(new TimeoutError()), ms))
}

module.exports = function timeout(promise, ms) {
  return Promise.race([
    to(ms),
    promise,
  ])
}
