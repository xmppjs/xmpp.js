import mech from 'sasl-xoauth2'

export function plugin (client) {
  client.SASL.use(mech)
}

export default plugin
