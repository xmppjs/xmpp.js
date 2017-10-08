'use strict'

const middleware = require('./middleware')

module.exports = function({router}) {
  return {
    use(type, ns, name, fn) {
      return router.use(middleware(type, ns, name, fn))
    },
    get(...args) {
      return router.use(middleware('get', ...args))
    },
    set(...args) {
      return router.use(middleware('set', ...args))
    },
  }
}
