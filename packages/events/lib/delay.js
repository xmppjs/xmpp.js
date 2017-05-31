'use strict'

module.exports = function delay(timeout) {
  return new Promise(resolve => {
    setTimeout(resolve, timeout)
  })
}
