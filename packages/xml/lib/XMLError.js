'use strict'

module.exports = class XMLError extends Error {
  constructor(...args) {
    super(...args)
    this.name = 'XMLError'
  }
}
