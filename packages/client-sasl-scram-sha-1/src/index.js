import mech from 'sasl-scram-sha-1'

export function plugin (client) {
  client.SASL.use(mech)
}

export default plugin
