
const xml = require('@xmpp/xml')
const iqCaller = require('../iq-caller')

const NS_VCARD = 'vcard-temp'

function plugin (entity) {
  const caller = entity.plugin(iqCaller)

  const _parsevCard =  (el) => {
    let dict = {}
    el.children.forEach((c) => {
      if (c.children && typeof c.children[0] === 'string')
        dict[c.name] = c.text()
      else
        dict[c.name] = _parsevCard(c)
    })
    return dict
  }

  const _buildvCard = (dict, parent) => {
    let builder = parent ? parent : xml`<vCard xmlns="${NS_VCARD}" version="2.0"/>`
    for (let [key, val] of Object.entries(dict)) {
      if (typeof val === 'object')
        builder.cnode(_buildvCard(val, xml`<${key}/>`)).up()
      else if (val)
        builder.c(key).t(val)
      else
        builder.c(key).up()
    }
    return builder
  }

  return {
    entity,
    get(jid) {
      return caller.get(jid,
        xml`<vCard xmlns='${NS_VCARD}'/>`
      )
      .then((res) => {
        return Promise.resolve(_parsevCard(res))
      })
    },
    set(vcard) {
      return caller.set(null, _buildvCard(vcard))
    },
  }
}

export default {
  name: 'vCard',
  NS_VCARD,
  plugin,
}
