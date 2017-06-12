'use strict'

const {xml, plugin} = require('@xmpp/plugin')
const iqCaller = require('../iq-caller')
const stanzaRouter = require('../stanza-router')

const NS_PUBSUB = 'http://jabber.org/protocol/pubsub'
const NS_PUBSUB_EVENT = `${NS_PUBSUB}#event`
const NS_PUBSUB_OWNER = `${NS_PUBSUB}#owner`
const NS_PUBSUB_NODE_CONFIG = `${NS_PUBSUB}#node_config`
const NS_ATOM = 'http://www.w3.org/2005/Atom'
const NS_DELAY = 'urn:xmpp:delay'
const NS_RSM = 'http://jabber.org/protocol/rsm'
const NS_X_DATA = 'jabber:x:data'

module.exports = service =>
  plugin('pubsub', {
    NS_PUBSUB,
    NS_PUBSUB_EVENT,
    NS_PUBSUB_OWNER,
    NS_PUBSUB_NODE_CONFIG,
    NS_ATOM,
    NS_DELAY,
    NS_RSM,
    NS_X_DATA,

    service,

    matchPEP(stanza) {
      const ev = stanza.getChild('event')
      return (
        ev &&
        ev.attrs.xmlns === NS_PUBSUB_EVENT &&
        stanza.is('message') &&
        stanza.attrs.from === service
      )
    },

    start() {
      if (service) {
        this.plugins['stanza-router'].add(this.matchPEP, this.onPEPEvent)
      }
    },

    stop() {
      if (service) {
        this.plugins['stanza-router'].remove(this.matchPEP)
      }
    },

    onPEPEvent(message, client) {
      const items = message.getChild('event').getChild('items')
      const {node} = items.attrs
      const item = items.getChild('item')
      const {id} = item.attrs
      const entry = item.getChild('entry')
      client.emit('item-published', {node, id, entry})
      client.emit(`item-published:${node}`, {id, entry})
    },

    createNode(node, options, ...args) {
      const stanza = xml`
        <pubsub xmlns='${NS_PUBSUB}'>
          <create node='${node}'/>
        </pubsub>`

      if (options) {
        const config = xml`<configure/>`
        const x = config.cnode(xml`
          <x xmlns='${NS_X_DATA}' type='submit'>
            <field var='FORM_TYPE' type='hidden'>
              <value>${NS_PUBSUB_NODE_CONFIG}</value>
            </field>
          </x>`)

        for (const key of Object.keys(options)) {
          const option = xml`
            <field var='${key}'>
              <value>${options[key].toString()}</value>
            </field>`
          x.cnode(option)
        }
        stanza.cnode(config)
      }

      return this.plugins['iq-caller'].set(stanza, ...args)
      .then(result => result.getChild('create').attrs.node)
    },

    deleteNode(node, ...args) {
      const stanza = xml`
        <pubsub xmlns='${NS_PUBSUB}'>
          <delete node='${node}'/>
        </pubsub>`
      return this.plugins['iq-caller'].set(stanza, ...args)
    },

    publish(node, item, ...args) {
      const stanza = xml`
        <pubsub xmlns='${NS_PUBSUB}'>
          <publish node='${node}'></publish>
        </pubsub>`
      if (item) {
        stanza.getChild('publish').cnode(item)
      }
      return this.plugins['iq-caller'].set(stanza, ...args)
      .then(result => result.getChild('publish').getChild('item').attrs.id)
    },

    items(node, rsm, ...args) {
      const stanza = xml`
        <pubsub xmlns='${NS_PUBSUB}'>
          <items node='${node}'/>
        </pubsub>`

      if (rsm) {
        const rsmEl = xml`<set xmlns='${NS_RSM}'/>`
        for (const key of Object.keys(rsm)) {
          rsmEl.c(key).t(rsm[key])
        }
        stanza.up().cnode(rsmEl)
      }

      return this.plugins['iq-caller'].get(stanza, ...args)
      .then(result => {
        const rsmEl = result.getChild('set')
        const items = result.getChild('items').children

        if (rsmEl) {
          return {
            items,
            rsm: rsmEl.children.reduce((obj, el) => {
              obj[el.name] = el.text()
              return obj
            }, {}),
          }
        }
        return {items}
      })
    },

  }, [iqCaller, stanzaRouter])
