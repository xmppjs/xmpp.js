'use strict'

const request = require('./request')
const get = require('./get')
const set = require('./set')

function middleware(handlers) {
  return function({name, id, type, stanza, from}, next) {
    if (name !== 'iq') return next()
    if (!id) return next()

    console.log('truc')

    // const rid = `${type}-${from.toString()}-${id}`
    const handler = handlers[id]
    console.log(handlers, id)
    if (!handler) return next()

    if (type === 'error') {
      handler[0](stanza.getChild('error'))
    } else if (type === 'result') {
      handler[1](stanza.children[0])
    } else {
      return next()
    }

    delete handlers[id]
    next()
  }
}

module.exports = ({entity, handlers}) => {
  if (!handlers) handlers = Object.create(null)

  return {
    middleware: entity.use(middleware(handlers)),
    handlers,
    get: (...args) => get(entity, handlers, ...args),
    set: (...args) => set(entity, handlers, ...args),
    request: (...args) => request(entity, handlers, ...args),
  }
}
