import test from 'ava'
import {authenticate, plugin} from './src'

test('plugin', t => {
  const client = {}
  plugin(client)
  t.deepEqual(client.authenticators, [])
})

test('authenticate', t => {
  const creds = {}
  const client = {}
  plugin(client)
  t.throws(authenticate(client, creds), Error, 'no compatible authentication')
})
