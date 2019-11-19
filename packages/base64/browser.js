'use strict'

module.exports.encode = function encode(string) {
  return global.btoa(string)
}

module.exports.decode = function decode(string) {
  return global.atob(string)
}
