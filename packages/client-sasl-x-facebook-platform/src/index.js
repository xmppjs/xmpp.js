import mech from 'sasl-x-facebook-platform'

export function plugin (client) {
  client.SASL.use(mech)
}

export default plugin
