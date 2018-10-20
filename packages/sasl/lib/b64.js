'use strict'

const {Base64} = require('js-base64')

module.exports.encode = function encode(string) {
  if (global.btoa) {
    return global.btoa(string)
  }

  if (global.Buffer) {
    return Buffer.from(string, 'utf8').toString('base64')
  }

  return Base64.btoa(string)
}

module.exports.decode = function decode(string) {
  if (global.atob) {
    return global.atob(string)
  }

  if (global.Buffer) {
    return Buffer.from(string, 'base64').toString('utf8')
  }

  return Base64.btoa(string)
}
