'use strict'

const {EventEmitter} = require('@xmpp/events')

const {promisify} = require('util')
const fs = require('fs')
const writeFile = promisify(fs.writeFile)
const readFile = promisify(fs.readFile)
const unlink = promisify(fs.unlink)
const serialize = require('@xmpp/xml/lib/serialize')
const parse = require('@xmpp/xml/lib/parse')

class Storage extends EventEmitter {
  constructor({entity}) {
    super()
    this.entity = entity
  }

  async set(key, element) {
    return writeFile(
      `/tmp/${this.entity.jid.bare()}-${key}.xml`,
      `<?xml version='1.0' encoding='utf-8'?>\n${serialize(element, 2)}\n`
    ).catch(err => {
      this.emit('error', err)
      return null
    })
  }

  async get(key) {
    return readFile(`/tmp/${this.entity.jid.bare()}-${key}.xml`)
      .then(data => {
        return parse(data)
      })
      .catch(err => {
        this.emit('error', err)
        return null
      })
  }

  async delete(key) {
    return unlink(`/tmp/${this.entity.jid.bare()}-${key}.xml`).catch(err => {
      this.emit('error', err)
      return null
    })
  }
}

module.exports = function(...args) {
  return new Storage(...args)
}
