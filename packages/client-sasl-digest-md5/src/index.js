import mech from 'alt-sasl-digest-md5'

export function plugin (client) {
  client.SASL.use(mech)
}

export default plugin
