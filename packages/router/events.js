'use strict'

module.exports = function(ctx) {
  const {name, type, stanza} = ctx
  const [child] = stanza.children

  const events = [`${name}`]

  if (type) {
    events.push(`${name}-${type}`)
  }

  if (child && child.findNS) {
    const NS = child.findNS() || ''
    events.push(`${name}/${NS}/${child.name}`)
    if (type) {
      events.push(`${name}-${type}/${NS}/${child.name}`)
    }
  }

  return events
}
