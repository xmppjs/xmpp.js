'use strict'

const tag = require('./tag')

module.exports = function parse(str) {
  return tag([str], [])
}
