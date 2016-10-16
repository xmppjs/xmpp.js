'use strict'

const iqCallee = require('../iq-callee')
const discoInfo = require('../disco-info')
const xml = require('@xmpp/xml')

const NS_VERSION = 'jabber:iq:version'

function match (stanza) {
  return stanza.getChild('query', NS_VERSION)
}

function plugin (entity) {
  const vars = Object.create(null)

  const disco = entity.plugin(discoInfo)
  disco.addFeature(NS_VERSION)

  const callee = entity.plugin(iqCallee)
  callee.add(match, (match, cb) => {
    const query = xml`<query xmlns='${NS_VERSION}'/>`
    Object.entries(vars).forEach(([k, v]) => {
      query.c(k).t(v)
    })
    return query
  })

  return {
    entity,
    vars,
    set (key, value) {
      vars[key] = value
    },
    get (key) {
      return vars[key]
    },
    del (key) {
      delete vars[key]
    }
  }
}

module.exports = {
  NS_VERSION,
  match,
  name: 'version-handle',
  plugin
}
