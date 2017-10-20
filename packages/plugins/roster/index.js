'use strict'

const {xml, plugin} = require('@xmpp/plugin')
const JID = require('@xmpp/jid')
const iqCaller = require('../iq-caller')
const iqCallee = require('../iq-callee')

const NS = 'jabber:iq:roster'

function parseItem(item) {
  return Object.assign({}, item.attrs, {
    groups: item.getChildren('group').map(group => group.text()),
    approved: item.attrs.approved === 'true',
    ask: item.attrs.ask === 'subscribe',
    name: item.attrs.name || '',
    subscription: item.attrs.subscription || 'none',
    jid: new JID(item.attrs.jid),
  })
}

module.exports = plugin(
  'roster',
  {
    get(ver, ...args) {
      return this.plugins['iq-caller']
        .get(xml('query', {xmlns: NS, ver}), ...args)
        .then(res => {
          // Correct ver
          if (!res) {
            return []
          }

          return [res.getChildren('item').map(parseItem), res.attrs.ver]
        })
    },
    set(item, ...args) {
      if (typeof item === 'string' || item instanceof JID.JID) {
        item = {jid: item}
      }

      const groups = item.groups || []
      delete item.groups
      return this.plugins['iq-caller'].set(
        xml(
          'query',
          {xmlns: NS},
          xml('item', item, groups.map(g => <group>{g}</group>))
        ),
        ...args
      )
    },
    remove(jid, ...args) {
      return this.plugins['iq-caller'].set(
        xml('query', {xmlns: NS}, xml('item', {jid, subscription: 'remove'})),
        ...args
      )
    },

    // Handles roster pushes
    start() {
      this.plugins['iq-callee'].set(NS, child => {
        if (
          child.parent.attrs.from &&
          child.parent.attrs.from !== this.entity.jid.bare()
        ) {
          return
        }

        const item = parseItem(child.getChild('item'))
        if (item.subscription === 'remove') {
          this.emit('remove', [item.jid, child.attrs.ver])
        } else {
          this.emit('set', [item, child.attrs.ver])
        }
      })
    },
  },
  [iqCaller, iqCallee]
)
