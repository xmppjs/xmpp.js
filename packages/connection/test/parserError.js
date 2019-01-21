'use strict'

const test = require('ava')
const Connection = require('..')
const {EventEmitter} = require('@xmpp/events')

test('calls _detachParser and emits error', t => {
  t.plan(2)
  const conn = new Connection()
  const parser = new EventEmitter()
  conn._attachParser(parser)

  const error = {}
  conn._detachParser = () => {
    t.pass()
  }

  conn.on('error', err => {
    t.is(err, error)
  })
  parser.emit('error', error)
})
