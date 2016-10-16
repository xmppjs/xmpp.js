'use strict'

const _handle = require('./handle')
const _query = require('./query')

module.exports = {
  name: 'version',
  plugin (entity) {
    const handle = entity.plugin(_handle)
    const query = entity.plugin(_query)
    return {
      entity,
      handle,
      query
    }
  },
  handle: _handle,
  query: _query
}
