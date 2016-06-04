import mech from 'sasl-plain'

export function plugin (client) {
  client.SASL.use(mech)
}

export default plugin
