/**
 * References
 * https://xmpp.org/extensions/xep-0170.html XEP-0170: Recommended Order of Stream Feature Negotiation
 */

function register (client, priority, run, match, restart) {
  client._streamFeatures.push({priority, run, match, restart})
}

function registerClient (feature) {
  register(this, feature.priority, feature.run, feature.match, !!feature.restart)
}

function selectFeature (client, el) {
  return selectFeatures(client, el)[0]
}

function selectFeatures (client, el) {
  return client._streamFeatures
    .filter(f => f.match(el, client) && !client._negotiatedFeatures.includes(f))
    .sort((a, b) => {
      return a.priority < b.priority
    })
}

function loopFeatures (features, client, el) {
  const feature = features.shift()
  feature.run(client, el) // eslint-disable-line
    .then(() => {
      if (feature.restart) {
        return client.restart()
      } else {
        if (features.length) {
          loopFeatures(features, client, el)
        } else if (client.jid) {
          client._online(client.jid)
        }
      }
    })
    .catch(err => client.emit('error', err))
}

function plugin (client) {
  client._streamFeatures = []
  client._negotiatedFeatures = []
  client.on('nonza', el => {
    if (el.name !== 'stream:features') return;

    client.emit('features', el)
    const features = selectFeatures(client, el)
    if (features.length === 0) return

    loopFeatures(features, client, el)
  })
  client.registerStreamFeature = registerClient
}

export {register, plugin, selectFeature, selectFeatures}
export default plugin
