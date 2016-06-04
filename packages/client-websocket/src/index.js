import WebSocket from './lib/WebSocket'

export {WebSocket}

export function plugin (client) {
  client.transports.push(WebSocket)
}

export default plugin
