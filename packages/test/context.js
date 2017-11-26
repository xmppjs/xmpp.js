'use strict'

const client = require('./client')
const xml = require('@xmpp/xml')

module.exports = function context() {
  const entity = client()
  return {
    entity,
    sanitize(s) {
      const stanza = s.clone()
      const {id} = stanza.attrs
      delete stanza.attrs.id
      delete stanza.attrs.xmlns
      return {stanza, id}
    },
    catch() {
      return entity.promise('send').then(s => this.sanitize(s))
    },
    catchOutgoing(fn) {
      return new Promise(resolve => {
        function onSend(stanza) {
          if (!fn || fn(stanza)) {
            entity.removeListener('send', onSend)
            resolve(stanza)
          }
        }
        entity.on('send', onSend)
      })
    },
    catchOutgoingIq(fn) {
      return this.catchOutgoing(stanza => {
        return stanza.is('iq') && fn ? fn(stanza) : true
      })
    },
    catchOutgoingGet(fn) {
      return this.catchOutgoingIq(
        stanza => (stanza.attrs.type === 'get' && fn ? fn(stanza) : true)
      ).then(stanza => {
        const [child] = stanza.children
        if (child) {
          child.parent = null
        }
        return child
      })
    },
    catchOutgoingSet(fn) {
      return this.catchOutgoingIq(
        stanza => (stanza.attrs.type === 'get' && fn ? fn(stanza) : true)
      ).then(stanza => {
        const [child] = stanza.children
        if (child) {
          child.parent = null
        }
        return child
      })
    },
    scheduleIncomingResult(child) {
      return this.entity.promise('send').then(stanza => {
        const {id} = stanza.attrs
        return this.fakeIncomingResult(child, id)
      })
    },
    scheduleIncomingError(child) {
      return this.entity.promise('send').then(stanza => {
        const {id} = stanza.attrs
        return this.fakeIncomingError(child, id)
      })
    },
    fakeIncomingGet(child) {
      return this.fakeIncomingIq(xml('iq', {type: 'get'}, child)).then(
        stanza => {
          const [child] = stanza.children
          if (child) {
            child.parent = null
          }
          return child
        }
      )
    },
    fakeIncomingSet(child) {
      return this.fakeIncomingIq(xml('iq', {type: 'set'}, child)).then(
        stanza => {
          const [child] = stanza.children
          if (child) {
            child.parent = null
          }
          return child
        }
      )
    },
    fakeIncomingResult(child, id) {
      return this.fakeIncomingIq(xml('iq', {type: 'result', id}, child)).then(
        stanza => {
          const [child] = stanza.children
          if (child) {
            child.parent = null
          }
          return child
        }
      )
    },
    fakeIncomingError(child, id) {
      return this.fakeIncomingIq(xml('iq', {type: 'error', id}, child))
        .then()
        .then(stanza => {
          const [child] = stanza.children
          if (child) {
            child.parent = null
          }
          return child
        })
    },
    fakeIncomingIq(el) {
      const stanza = el.clone()
      if (stanza.is('iq') && !stanza.attrs.id) {
        stanza.attrs.id = 'fake'
      }
      return this.fakeIncoming(stanza)
    },
    fakeIncoming(el) {
      const p = entity.promise('send')
      const stanza = el.clone()
      delete stanza.attrs.xmlns
      Promise.resolve().then(() => entity.emit('element', stanza))
      return p.then(el => {
        return this.sanitize(el).stanza
      })
    },
    fakeOutgoing(el) {
      entity.hookOutgoing(el)
    },
  }
}
