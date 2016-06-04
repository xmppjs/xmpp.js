import mech from 'sasl-anonymous'

export function plugin (client) {
  client.SASL.use(mech)
}

export default plugin
