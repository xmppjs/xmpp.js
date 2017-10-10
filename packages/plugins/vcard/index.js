'use strict'

const {xml, plugin} = require('@xmpp/plugin')
const iqCaller = require('../iq-caller')
const entries = require('object.entries')

const NS = 'vcard-temp'

function parse({children}) {
  return children.reduce((dict, c) => {
    dict[c.name] =
      c.children && typeof c.children[0] === 'string' ? c.text() : parse(c)
    return dict
  }, {})
}

function build(dict, parent) {
  return (parent || xml('vCard', {xmlns: NS})).append(
    entries(dict).map(([key, val]) => {
      return typeof val === 'object' ? build(val, xml(key)) : xml(key, {}, val)
    })
  )
}

module.exports = plugin(
  'vcard',
  {
    NS,
    get(...args) {
      return this.plugins['iq-caller']
        .get(xml('vCard', {xmlns: NS}), ...args)
        .then(parse)
    },
    set(vcard, ...args) {
      return this.plugins['iq-caller'].set(build(vcard), ...args)
    },
    build,
    parse,
  },
  [iqCaller]
)
