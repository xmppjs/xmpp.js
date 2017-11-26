'use strict'

module.exports.encode = function encode(string) {
  if (!global.Buffer) {
    return global.btoa(string)
  }
  return Buffer.from(string, 'utf8').toString('base64')
}

module.exports.decode = function decode(string) {
  if (!global.Buffer) {
    return global.atob(string)
  }
  return Buffer.from(string, 'base64').toString('utf8')
}
