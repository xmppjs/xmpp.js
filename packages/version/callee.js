'use strict'

const xml = require('@xmpp/xml')

const NS_VERSION = 'jabber:iq:version'

module.exports = function({iqCallee, discoCallee, name, version, os}) {
  const fields = {name, version, os}

  discoCallee.features.add(NS_VERSION)
  iqCallee.get(NS_VERSION, 'query', () => {
    return xml(
      'query',
      {xmlns: NS_VERSION},
      ['name', 'version', 'os'].map(v => xml(v, {}, fields[v]))
    )
  })

  return fields
}
