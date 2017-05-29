'use strict'

const client = require('../client-core')

module.exports = function (p) {
  const entity = client()
  entity.socket = {
    write(data, cb) {
      cb()
    },
  }
  const plugin = entity.plugin(p)

  return {
    entity,
    plugin,
    test(element) {
      const p = entity.promise('send')
      entity.emit('element', element)
      return p
    },
  }
}
