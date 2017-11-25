'use strict'

const events = require('./events')

module.exports = function route(event, handler) {
  return function(ctx, next) {
    if (!events(ctx).includes(event)) return next()
    return handler(ctx, next)
  }
}
