'use strict'

const xml = require('@xmpp/xml')
const {EventEmitter} = require('@xmpp/events')

const NS = 'jabber:iq:roster'
const NS_ROSTER_VER = 'urn:xmpp:features:rosterver'

function isRosterVersioningSupported(streamFeatures) {
  const {features} = streamFeatures
  return features && features.getChild('ver', NS_ROSTER_VER)
}

function removeRosterItem(roster, jid) {
  const child = roster
    .getChildren('item', NS)
    .find(item => item.attrs.jid === jid)
  roster.remove(child)
  return child
}

class RosterConsumer extends EventEmitter {
  constructor({iqCaller, iqCallee, entity, streamFeatures}, storage) {
    super()
    this.iqCaller = iqCaller
    this.entity = entity
    this.iqCallee = iqCallee
    this.streamFeatures = streamFeatures
    this.roster = null

    if (storage) {
      this.save = storage.save
      this.read = storage.read
    }
  }

  start() {
    this.iqCallee.set(NS, 'query', this._onRosterPush.bind(this))
  }

  save() {}

  read() {}

  // https://xmpp.org/rfcs/rfc6121.html#roster-syntax-actions-push
  _onRosterPush({element}) {
    // A receiving client MUST ignore the stanza unless it has no 'from' attribute
    // (i.e., implicitly from the bare JID of the user's account)
    // or it has a 'from' attribute whose value matches the user's bare JID <user@domainpart>.
    const {from} = element.attrs
    if (from && this.entity.jid.bare().equals(from)) {
      return
    }

    const item = element.getChild('item')
    removeRosterItem(this.roster, item.attrs.jid)
    this.roster.attrs.ver = element.attrs.ver
    if (item.subscription === 'remove') {
      this.emit('delete', item)
    } else {
      this.roster.append(item)
      this.emit('set', item)
    }

    this.save(this.roster, this.entity.jid.bare().toString())

    return true
  }

  async get(timeout) {
    let roster

    const local = await this.read(this.entity.jid.bare().toString())
    const remote = await this.fetch(local ? local.attrs.ver : null, timeout)

    if (remote) {
      // Roster has changed
      roster = remote
      this.save(roster, this.entity.jid.bare().toString())
    } else {
      // Roster has not changed
      roster = local
    }

    this.roster = roster
    return roster
  }

  async fetch(ver, timeout) {
    // If the server does not advertise support for roster versioning, the client MUST NOT include the 'ver' attribute.
    if (!isRosterVersioningSupported(this.streamFeatures)) {
      ver = undefined
    }

    return this.iqCaller.get(xml('query', {xmlns: NS, ver}), null, timeout)
  }

  // https://xmpp.org/rfcs/rfc6121.html#roster-add
  // https://xmpp.org/rfcs/rfc6121.html#roster-update
  async set(item, timeout) {
    return this.iqCaller.set(xml('query', {xmlns: NS}, item), null, timeout)
  }

  // https://xmpp.org/rfcs/rfc6121.html#roster-delete
  async delete(jid, timeout) {
    return this.iqCaller.set(
      xml('query', {xmlns: NS}, xml('item', {jid, subscription: 'remove'})),
      null,
      timeout
    )
  }
}

module.exports = function(...args) {
  const roster = new RosterConsumer(...args)
  roster.start()
  return roster
}
