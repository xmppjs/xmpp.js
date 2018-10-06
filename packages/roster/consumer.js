'use strict'

const xml = require('@xmpp/xml')
const JID = require('@xmpp/jid')
const EventEmitter = require('events')

const NS = 'jabber:iq:roster'

function parseItem(item) {
  return {
    ...item.attrs,
    groups: item.getChildren('group').map(group => group.text()),
    approved: item.attrs.approved === 'true',
    ask: item.attrs.ask === 'subscribe',
    name: item.attrs.name || '',
    subscription: item.attrs.subscription || 'none',
    jid: new JID(item.attrs.jid),
  }
}

class RosterConsumer extends EventEmitter {
  constructor({iqCaller, iqCallee, entity}) {
    super()
    this.iqCaller = iqCaller
    this.entity = entity

    iqCallee.set(NS, ctx => this._onRosterPush(ctx))
  }

  _onRosterPush({element, from}) {
    if (!from.bare().equals(this.entity.jid.bare())) {
      return
    }

    const {ver} = element.attrs

    const item = parseItem(element.getChild('item'))
    if (item.subscription === 'remove') {
      this.emit('remove', [item.jid, ver])
    } else {
      this.emit('set', [item, ver])
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
        xml('item', item, groups.map(g => xml('group', {}, g)))
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
