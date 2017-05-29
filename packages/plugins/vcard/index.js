'use strict'

const xml = require('@xmpp/xml')
const iqCaller = require('../iq-caller')

const NS_VCARD = 'vcard-temp'

const parsevCard = (el) => {
  const dict = {}
  el.children.forEach((c) => {
    if (c.children && typeof c.children[0] === 'string') {
      dict[c.name] = c.text()
    } else {
      dict[c.name] = parsevCard(c)
    }
  })
  return dict
}

const buildvCard = (dict, parent) => {
  const builder = parent || xml`<vCard xmlns="${NS_VCARD}" version="2.0"/>`
  for (const [key, val] of Object.entries(dict)) {
    if (typeof val === 'object') {
      builder.cnode(buildvCard(val, xml`<${key}/>`)).up()
    } else if (val) {
      builder.c(key).t(val)
    } else {
      builder.c(key).up()
    }
  }
  return builder
}

function plugin (entity) {
  const caller = entity.plugin(iqCaller)

  return {
    entity,
    get (...args) {
      return caller.get(xml`<vCard xmlns='${NS_VCARD}'/>`, ...args)
      .then(res => parsevCard(res))
    },
    set (vcard) {
      return caller.set(buildvCard(vcard))
    },
  }
}

module.exports = {
  name: 'vcard',
  NS_VCARD,
  buildvCard,
  parsevCard,
  plugin,
}
