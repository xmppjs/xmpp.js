'use strict'

const timeout = require('./timeout')
const delay = require('./delay')
const TimeoutError = require('./TimeoutError')
const promise = require('./promise')
const EventEmitter = require('events')
const Deferred = require('./Deferred')

exports.EventEmitter = EventEmitter
exports.timeout = timeout
exports.delay = delay
exports.TimeoutError = TimeoutError
exports.promise = promise
exports.Deferred = Deferred
