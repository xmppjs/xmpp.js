import mech from 'sasl-x-oauth2'

export function plugin (client) {
  client.SASL.use(mech)
}

export default plugin
