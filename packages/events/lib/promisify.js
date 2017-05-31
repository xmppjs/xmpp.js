'use strict'

module.exports = function promisify(fn) {
  return (...args) => new Promise((resolve, reject) => {
    fn(...args, (err, value) => {
      if (err !== undefined && err !== null) {
        reject(err)
      } else {
        resolve(value)
      }
    })
  })
}
