'use strict'

const xml = require('@xmpp/xml')
const iqCaller = require('../iq-caller')

const NS_TIME = 'urn:xmpp:time'

const fields = ['tzo', 'utc']

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
      return caller.get(to, xml`<time xmlns='${NS_TIME}'/>`, ...args)
    }
  }
}

module.exports = {
  name: 'time-query',
  NS_TIME,
  plugin
}
