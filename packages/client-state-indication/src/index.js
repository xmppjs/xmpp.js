'use strict'

// https://xmpp.org/extensions/xep-0352.html

const ltx = require('ltx')

const NS = 'urn:xmpp:csi:0'

function setActive () {
  this.send(ltx`<active xmlns="${NS}"/>`)
}

function setInactive () {
  this.send(ltx`<inactive xmlns="${NS}"/>`)
}

function isSupported (features) {
  return features.getChild('csi', NS)
}

module.exports = function (client) {
  client.setActive = setActive
  client.setInactive = setInactive
}

module.exports = isSupported

module.exports.NS = NS
