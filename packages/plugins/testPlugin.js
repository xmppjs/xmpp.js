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
    catchOutgoingGet() {
      return entity.promise('send').then(stanza => {
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
    fakeIncomingIq(el) {
      const p = entity.promise('send')
      const stanza = el.clone()
      delete stanza.attrs.xmlns
      if (stanza.is('iq') && !stanza.attrs.id) {
        stanza.attrs.id = 'fake'
      }
      Promise.resolve().then(() => entity.emit('element', stanza))
      return p.then(el => {
        return this.sanitize(el).stanza
      })
    },
  }
}
