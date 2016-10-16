'use strict'

const crypto = require('crypto')

const store = Object.create(null)

module.exports = {
  store,
  hash(jid) {
    return crypto
      .createHash('md5')
      .update(jid.toString())
      .digest('hex')
  },
  set(hash, key, value) {
    if (!store[hash]) store[hash] = Object.create(null)
    store[hash][key] = value
  },
  get(hash, key) {
    if (!store[hash]) return undefined
    return store[hash][key]
  },
  del(hash, key) {
    if (!store[hash]) return
    delete store[hash][key]
  },
  forget(hash) {
    delete store[hash]
  }
}
