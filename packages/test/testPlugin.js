'use strict'

const context = require('./context')

module.exports = function(p) {
  const ctx = context()
  ctx.plugin = ctx.entity.plugin(p)
  ctx.plugins = ctx.entity.plugins
  return ctx
}
