import mech from 'alt-sasl-external'

export function plugin (client) {
  client.SASL.use(mech)
}

export default plugin
