'use strict'

const xml = require('@xmpp/xml')
const JID = require('@xmpp/jid')
const EventEmitter = require('events')
const {NS} = require('.')

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

class RosterConsumer extends EventEmitter {
  constructor({iqCaller, iqCallee, entity}) {
    super()
    this.iqCaller = iqCaller
    this.entity = entity

    iqCallee.set(NS, child => this._onRosterPush(child))
  }

  _onRosterPush(child) {
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
  }

  get(ver, ...args) {
    return this.iqCaller
      .get(xml('query', {xmlns: NS, ver}), ...args)
      .then(res => {
        // Correct ver
        if (!res) {
          return []
        }

        return [res.getChildren('item').map(x => parseItem(x)), res.attrs.ver]
      })
  }

  set(item, ...args) {
    if (typeof item === 'string' || item instanceof JID.JID) {
      item = {jid: item}
    }

    const groups = item.groups || []
    delete item.groups
    return this.iqCaller.set(
      xml(
        'query',
        {xmlns: NS},
        xml('item', item, groups.map(g => <group>{g}</group>))
      ),
      ...args
    )
  }

  remove(jid, ...args) {
    return this.iqCaller.set(
      xml('query', {xmlns: NS}, xml('item', {jid, subscription: 'remove'})),
      ...args
    )
  }
}

module.exports = function(...args) {
  const roster = new RosterConsumer(...args)
  return roster
}
