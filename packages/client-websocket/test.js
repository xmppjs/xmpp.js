import test from 'ava'
import Client from '../client-core'
import stream_features from '../client-stream-features'
import authentication from '../client-authentication'
import sasl from '../client-sasl'
import sasl_plain from '../client-sasl-plain'
import websocket from '.'

console.log(stream_features)
console.log(authentication)
console.log(sasl)
console.log(sasl_plain)
console.log(websocket)

test.cb('websocket', t => {
  const client = new Client()
  client.use(stream_features)
  client.use(authentication)
  client.use(sasl)
  client.use(sasl_plain)
  client.use(websocket)
  client.start('ws://localhost:5280/xmpp-websocket')
  client.on('authenticate', authenticate => {
    console.log('authenticate')
    authenticate('sonny', 'azer2310')
  })
  client.on('online', (jid) => {
    console.log('online', jid)
    t.end()
  })
})
