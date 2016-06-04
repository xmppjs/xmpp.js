function request (client, stanza, options = {}) {
  return new Promise((resolve, reject) => {
    stanza = stanza.root()
    if (!stanza.attrs.id) stanza.attrs.id = client.id()

    // TODO
    if (options.next === true) client._iqNext = true

    client._iqHandlers[stanza.attrs.id] = [resolve, reject]

    client.send(stanza)
  })
}

function stanzaHandler (stanza) {
  const id = stanza.attrs.id
  if (
    !stanza.is('iq') ||
    !id ||
    (stanza.attrs.type !== 'error' && stanza.attrs.type !== 'result')
  ) return

  const handler = this._iqHandlers[id]
  if (!handler) return

  if (stanza.attrs.type === 'error') {
    handler[1](stanza.getChild('error'))
  } else {
    handler[0](stanza.children[0])
  }

  delete this._iqHandlers[id]
}

function plugin (client) {
  client._iqHandlers = Object.create(null)
  client.on('element', stanzaHandler.bind(client))
}

export {request, stanzaHandler, plugin}
export default plugin
