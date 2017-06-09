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

module.exports = plugin('pubsub', {
  NS_PUBSUB,
  NS_PUBSUB_EVENT,
  NS_PUBSUB_OWNER,
  NS_PUBSUB_NODE_CONFIG,
  NS_ATOM,
  NS_DELAY,
  NS_RSM,
  NS_X_DATA,

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
      // Fill me.
    }
    return this.plugins['iq-caller'].get(stanza, ...args)
    .then(result => result.getChild('items').children)
  },

}, [iqCaller])
