'use strict'

const timeout = require('./lib/timeout')
const delay = require('./lib/delay')
const TimeoutError = require('./lib/TimeoutError')
const promise = require('./lib/promise')
const EventEmitter = require('events')
const Deferred = require('./lib/Deferred')

exports.EventEmitter = EventEmitter
exports.timeout = timeout
exports.delay = delay
exports.TimeoutError = TimeoutError
exports.promise = promise
exports.Deferred = Deferred
