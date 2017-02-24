'use strict'

const xml = require('@xmpp/xml')
const Plugin = require('../../lib/Plugin')

const NS = 'jabber:iq:register'

class RegisterPlugin extends Plugin {
  constructor (entity, caller) {
    super(entity)
    this.caller = caller
  }

  gotFeatures () {
    return this.getFields().then((fields) => {
      return this.onFields(fields, (...args) => {
        return this.setFields(...args)
      })
    })
  }

  getFields () {
    return this.caller.get(null, xml`<query xmlns='${NS}'/>`).then((res) => {
      const fields = {}
      ;['instructions', 'username', 'password', 'email', 'registered'].forEach((field) => {
        const t = res.getChildText(field)
        if (typeof t === 'string') fields[field] = t
      })
      return fields
    })
  }

  setFields (username, password, email) {
    const el = xml`
      <query xmlns='${NS}'>
        <username>${username}</username>
        <password>${password}</password>
      </query>
    `
    if (email) el.getChild('query').c('email', {}, email)

    return this.caller.set(null, el).then((res) => {
      return res
    })
  }
}

module.exports = RegisterPlugin
