'use strict'

const {xml, plugin} = require('@xmpp/plugin')
const iqCaller = require('../iq-caller')

const NS = 'vcard-temp'

const parse = el => {
  const dict = {}
  el.children.forEach(c => {
    if (c.children && typeof c.children[0] === 'string') {
      dict[c.name] = c.text()
    } else {
      dict[c.name] = parse(c)
    }
  })
  return dict
}

const build = (dict, parent) => {
  const el = parent || xml`<vCard xmlns='${NS}' version='2.0'/>`
  for (const key of Object.keys(dict)) {
    const val = dict[key]
    if (typeof val === 'object') {
      el.cnode(build(val, xml`<${key}/>`))
    } else if (val) {
      el.cnode(xml`<${key}>${val}</${key}>`)
    } else {
      el.cnode(xml`<${key}/>`)
    }
  }
  return el
}

module.exports = plugin('vcard', {
  NS,
  get(...args) {
    return this.plugins['iq-caller'].get(xml`<vCard xmlns='${NS}'/>`, ...args).then(parse)
  },
  set(vcard) {
    return this.plugins['iq-caller'].set(build(vcard))
  },
  build,
  parse,
}, [iqCaller])
