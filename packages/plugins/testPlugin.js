'use strict'

const {Client} = require('../client-core')

module.exports = function(p) {
  const entity = new Client()
  entity.socket = {
    write(data, cb) {
      cb()
    },
  }
  const plugin = entity.plugin(p)

  return {
    entity,
    plugin,
    fake(el) {
      const p = entity.promise('send')
      entity.emit('element', el)
      return p.then(el => {
        delete el.attrs.xmlns
        return el
      })
    },
  }
}
