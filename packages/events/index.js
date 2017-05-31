'use strict'

const EventEmitter = require('./lib/EventEmitter')
const promisify = require('./lib/promisify')
const timeout = require('./lib/timeout')
const delay = require('./lib/delay')
const TimeoutError = require('./lib/TimeoutError')
const promise = require('./lib/promise')

exports = module.exports = EventEmitter
exports.EventEmitter = EventEmitter
exports.promisify = promisify
exports.timeout = timeout
exports.delay = delay
exports.TimeoutError = TimeoutError
exports.promise = promise
exports.promify = function promify(obj, method, ...args) {
  return new Promise((resolve, reject) => {
    obj[method](...args, (err, value) => {
      if (err !== null && err !== undefined) {
        reject(err)
      } else {
        resolve(value)
      }
    })
  })
}
