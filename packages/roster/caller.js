'use strict'

const xml = require('@xmpp/xml')
const JID = require('@xmpp/jid')
const EventEmitter = require('events')

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

module.exports = function({iqCaller, iqCallee, entity}) {
  const ee = new EventEmitter()

  // Handles roster pushes

  iqCallee.set(NS, child => {
    if (
      child.parent.attrs.from &&
      child.parent.attrs.from !== entity.jid.bare()
    ) {
      return
    }

    const item = parseItem(child.getChild('item'))
    if (item.subscription === 'remove') {
      ee.emit('remove', [item.jid, child.attrs.ver])
    } else {
      ee.emit('set', [item, child.attrs.ver])
    }
  })

  return Object.assign(ee, {
    get(ver, ...args) {
      return iqCaller.get(xml('query', {xmlns: NS, ver}), ...args).then(res => {
        // Correct ver
        if (!res) {
          return []
        }

        return [res.getChildren('item').map(x => parseItem(x)), res.attrs.ver]
      })
    },
    set(item, ...args) {
      if (typeof item === 'string' || item instanceof JID.JID) {
        item = {jid: item}
      }

      const groups = item.groups || []
      delete item.groups
      return iqCaller.set(
        xml(
          'query',
          {xmlns: NS},
          xml('item', item, groups.map(g => <group>{g}</group>))
        ),
        ...args
      )
    },
    remove(jid, ...args) {
      return iqCaller.set(
        xml('query', {xmlns: NS}, xml('item', {jid, subscription: 'remove'})),
        ...args
      )
    },
  })
}
