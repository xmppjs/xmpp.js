'use strict'

const {Client} = require('../client-core')

module.exports = function(p) {
  const entity = new Client()
  entity.socket = {
    write(data, cb) {
      cb()
    },
  }
  const plugin = entity.plugin(p)

  return {
    entity,
    plugin,
    plugins: entity.plugins,
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
      return this.fakeIncomingIq(<iq type="get">{child}</iq>).then(stanza => {
        const [child] = stanza.children
        if (child) {
          child.parent = null
        }
        return child
      })
    },
    fakeIncomingSet(child) {
      return this.fakeIncomingIq(<iq type="set">{child}</iq>).then(stanza => {
        const [child] = stanza.children
        if (child) {
          child.parent = null
        }
        return child
      })
    },
    fakeIncomingResult(child, id) {
      return this.fakeIncomingIq(
        <iq type="result" id={id}>
          {child}
        </iq>
      ).then(stanza => {
        const [child] = stanza.children
        if (child) {
          child.parent = null
        }
        return child
      })
    },
    fakeIncomingError(child, id) {
      return this.fakeIncomingIq(
        <iq type="error" id={id}>
          {child}
        </iq>
      ).then(stanza => {
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
  }
}
