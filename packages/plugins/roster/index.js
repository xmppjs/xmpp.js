'use strict'

const {xml, plugin} = require('@xmpp/plugin')
const iqCaller = require('../iq-caller')

const NS = 'jabber:iq:roster'

module.exports = plugin('roster', {
  NS,
  get(...args) {
    return this.plugins['iq-caller'].get(xml`<query xmlns='${NS}'/>`, ...args)
    .then(res => {
      return res.getChildren('item').map(item => {
        const res = item.attrs
        res.groups = item.getChildren('group').map(group => group.text())
        return res
      })
    })
  },
}, [iqCaller])
