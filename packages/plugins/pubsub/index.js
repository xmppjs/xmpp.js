'use strict'

const {xml, plugin} = require('@xmpp/plugin')
const iqCaller = require('../iq-caller')

const NS_PUBSUB = 'http://jabber.org/protocol/pubsub'
const NS_PUBSUB_EVENT = `${NS_PUBSUB}#event`
const NS_PUBSUB_OWNER = `${NS_PUBSUB}#owner`
const NS_PUBSUB_NODE_CONFIG = `${NS_PUBSUB}#node_config`
const NS_ATOM = 'http://www.w3.org/2005/Atom'
const NS_DELAY = 'urn:xmpp:delay'
const NS_RSM = 'http://jabber.org/protocol/rsm'
const NS_X_DATA = 'jabber:x:data'

module.exports = plugin(
  'pubsub',
  {
    NS_PUBSUB,
    NS_PUBSUB_EVENT,
    NS_PUBSUB_OWNER,
    NS_PUBSUB_NODE_CONFIG,
    NS_ATOM,
    NS_DELAY,
    NS_RSM,
    NS_X_DATA,

    isPubSubEventNotification(stanza) {
      const child = stanza.getChild('event')
      return (
        stanza.is('message') && child && child.attrs.xmlns === NS_PUBSUB_EVENT
      )
    },

    start() {
      this.listener = stanza => {
        if (this.isPubSubEventNotification(stanza)) {
          this.onPubSubEventNotification(stanza)
        }
      }
      this.entity.on('element', this.listener)
    },

    stop() {
      this.entity.removeListener('element', this.listener)
    },

    onPubSubEventNotification(message) {
      const service = message.attrs.from
      const items = message.getChild('event').getChild('items')
      const {node} = items.attrs
      const item = items.getChild('item')
      const retract = items.getChild('retract')
      if (item) {
        const {id} = item.attrs
        const entry = item.getChild('entry')
        const delay = message.getChild('delay')

        if (delay) {
          const {stamp} = delay.attrs
          this.emit(`last-item-published:${service}`, {node, id, entry, stamp})
          this.emit(`last-item-published:${service}:${node}`, {id, entry, stamp})
        } else {
          this.emit(`item-published:${service}`, {node, id, entry})
          this.emit(`item-published:${service}:${node}`, {id, entry})
        }
      }
      if (retract) {
        const {id} = retract.attrs
        this.emit(`item-deleted:${service}`, {node, id})
        this.emit(`item-deleted:${service}:${node}`, {id})
      }
    },

    createNode(params, node, options) {
      const stanza = xml('pubsub', {xmlns: NS_PUBSUB}, xml('create', {node}))

      if (options) {
        const config = xml('configure')
        const x = config.cnode(
          xml(
            'x',
            {xmlns: NS_X_DATA, type: 'submit'},
            xml(
              'field',
              {var: 'FORM_TYPE', type: 'hidden'},
              xml('value', {}, NS_PUBSUB_NODE_CONFIG)
            )
          )
        )

        for (const key of Object.keys(options)) {
          const option = xml(
            'field',
            {var: key},
            xml('value', {}, options[key].toString())
          )
          x.cnode(option)
        }
        stanza.cnode(config)
      }

      return this.plugins['iq-caller']
        .set(stanza, params)
        .then(result => result.getChild('create').attrs.node)
    },

    deleteNode(params, node) {
      return this.plugins['iq-caller'].set(
        xml('pubsub', {xmlns: NS_PUBSUB}, xml('delete', {node})),
        params
      )
    },

    publish(params, node, item) {
      const stanza = xml('pubsub', {xmlns: NS_PUBSUB}, xml('publish', {node}))
      if (item) {
        stanza.getChild('publish').cnode(item)
      }
      return this.plugins['iq-caller']
        .set(stanza, params)
        .then(result => result.getChild('publish').getChild('item').attrs.id)
    },

    items(params, node, rsm) {
      const stanza = xml('pubsub', {xmlns: NS_PUBSUB}, xml('items', {node}))

      if (rsm) {
        const rsmEl = xml('set', {xmlns: NS_RSM})
        for (const key of Object.keys(rsm)) {
          rsmEl.c(key).t(rsm[key].toString())
        }
        stanza.up().cnode(rsmEl)
      }

      return this.plugins['iq-caller'].get(stanza, params).then(result => {
        const rsmEl = result.getChild('set')
        const items = result.getChild('items').children

        if (rsmEl) {
          return [
            items,
            rsmEl.children.reduce((obj, el) => {
              if (el.name === 'max' || el.name === 'count') {
                obj[el.name] = parseInt(el.text(), 10)
              } else {
                obj[el.name] = el.text()
              }
              return obj
            }, {}),
          ]
        }
        return [items]
      })
    },

    deleteItem(params, node, id, notify=true) {
      const stanza = xml('pubsub', {xmlns: NS_PUBSUB},
        xml('retract', {node, notify},
          xml('item', {id})))
      return this.plugins['iq-caller']
        .set(stanza, params)
    },
  },
  [iqCaller]
)
