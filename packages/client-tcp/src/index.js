import TCP from './lib/TCP'

export {TCP}

export function plugin (client) {
  client.transports.push(TCP)
}

export default plugin
