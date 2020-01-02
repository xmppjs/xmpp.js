'use strict'

const tls = require('tls')
const net = require('net')
const {promise} = require('@xmpp/events')

function canUpgrade(socket) {
  return socket instanceof net.Socket && !(socket instanceof tls.TLSSocket)
}

module.exports.canUpgrade = canUpgrade

async function upgrade(socket, options = {}) {
  const tlsSocket = tls.connect({socket, ...options})
  await promise(tlsSocket, 'secureConnect')

  return tlsSocket
}

module.exports.upgrade = upgrade
