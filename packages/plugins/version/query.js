'use strict'

const xml = require('@xmpp/xml')
const iqCaller = require('../iq-caller')

const NS_VERSION = 'jabber:iq:version'

const fields = ['os', 'version', 'name']

function plugin (entity) {
  const caller = entity.plugin(iqCaller)

  return {
    entity,
    get (to, ...args) {
      return this.query(to, ...args).then((res) => {
        const vars = {}
        fields.forEach(field => { vars[field] = res.getChildText(field) || '' })
        return vars
      })
    },
    query (to, ...args) {
      return caller.get(to, xml`<query xmlns='${NS_VERSION}'/>`, ...args)
    }
  }
}

module.exports = {
  name: 'version-query',
  NS_VERSION,
  plugin
}
