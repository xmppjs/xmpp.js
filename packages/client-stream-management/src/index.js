/* References
 * https://xmpp.org/extensions/xep-0198.html
 */

export const name = 'stream-management' // TODO add name to all plugins, maybe reference with doc?

export const NS = 'urn:xmpp:sm:3'

export function match (features) {
  return features.getChild('sm', NS)
}

export function enable (client, resume, cb) {
  // const handler = (nonza) => {
  //   if (nonza.attrs.xmlns !== NS) return

  //   if (nonza.name === 'enabled') {
  //     if (nonza.attrs.resume === 'true') {
  //       client.options.sm.id = nonza.attrs.id
  //     }
  //     cb(null, nonza)
  //   } else if (nonza.name === 'failed') {
  //     cb(nonza)
  //   } else {
  //     return
  //   }
  //   client.removeListener('nonza', handler)
  // }
  // client.on('nonza', handler)

  // client.on('close', () => {
  //   client.connect(client.uri, (err, features) => {
  //     // if (err) return // FIXME WAT?? - reconnect + backoff module?
  //     // client.open((err, features) => {
  //     if (err) return // FIXME WAT?? - reconnect + backoff module?
  //     if (isSupported(features) && client.options.sm.id) {
  //       const id = client.options.sm.id
  //       client.send(<enable xmlns={NS} resume='true' h='0' previd={id}/>)
  //     }
  //   })
  //   // })
  // })
  // return new Promise((resolve, reject) => {
    // FIXME make resume optional
    const enable = <enable xmlns={NS}/>
    enable.attrs.resume = 'true'
    if (client.options.sm.id) enable.attrs.id = client.options.sm.id

    return client.send_receive(enable).then(nonza => {
      // FIXME error
      if (nonza.attrs.xmlns !== NS) throw nonza

      if (nonza.name === 'enabled') {
        if (nonza.attrs.resume === 'true') {
          client.options.sm.id = nonza.attrs.id
        }
        client.outbound = 0
        return nonza
      } else if (nonza.name === 'failed') {
        throw nonza
      } else {
        // FIXME error
        throw nonza
      }
    })
  // })
}

export const streamFeature = {
  priority: 2000,
  match,
  run: (client, features) => {
    return enable(client)
  }
}

export function plugin (client) {
  if (!client.options.sm) client.options.sm = {}
  if (client.registerStreamFeature) {
    client.registerStreamFeature(streamFeature)
  }
}

export default plugin
