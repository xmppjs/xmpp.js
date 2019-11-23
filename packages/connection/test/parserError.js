'use strict'

const test = require('ava')
const Connection = require('..')
const {EventEmitter} = require('@xmpp/events')

test('calls _detachParser, sends a bad-format stream error and emit an error', t => {
  t.plan(3)
  const conn = new Connection()
  const parser = new EventEmitter()
  conn._attachParser(parser)

  const error = {}
  conn._detachParser = () => {
    t.pass()
  }

  conn._streamError = condition => {
    t.is(condition, 'bad-format')
  }

  conn.on('error', err => {
    t.is(err, error)
  })

  parser.emit('error', error)
})
