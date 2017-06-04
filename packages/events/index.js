'use strict'

const timeout = require('./lib/timeout')
const delay = require('./lib/delay')
const TimeoutError = require('./lib/TimeoutError')
const promise = require('./lib/promise')
const _EventEmitter = require('./lib/EventEmitter')

exports = module.exports = class EventEmitter extends _EventEmitter {}
exports.EventEmitter = _EventEmitter
exports.timeout = timeout
exports.delay = delay
exports.TimeoutError = TimeoutError
exports.promise = promise
