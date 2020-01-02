'use strict'

const test = require('ava')
const tls = require('tls')
const {canUpgrade} = require('./starttls')
const net = require('net')
const WebSocket = require('../websocket/lib/Socket')

test('canUpgrade', t => {
  t.is(canUpgrade(new WebSocket()), false)
  t.is(canUpgrade(new tls.TLSSocket()), false)
  t.is(canUpgrade(new net.Socket()), true)
})
