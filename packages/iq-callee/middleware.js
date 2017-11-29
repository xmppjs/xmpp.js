'use strict'

const xml = require('@xmpp/xml')

const NS_STANZA = 'urn:ietf:params:xml:ns:xmpp-stanzas'

function matches(ctx, type, ns, name) {
  if (ctx.name !== 'iq') return false
  if (ctx.type !== type) return false
  if (ctx.id) return false

  const child = ctx.stanza.getChild(name, ns)
  return child
}

module.exports = function(type, ns, name, handler) {
  return function(ctx, next) {
    const child = matches(ctx, type, ns, name)
    if (!child) return next()

    const iq = xml('iq', {
      to: ctx.from,
      id: ctx.id,
    })

    Promise.resolve(handler(child))
      .then(el => {
        iq.attrs.type = 'result'
        if (el) {
          iq.append(el)
        }
        ctx.response = iq
        next()
      })
      .catch(err => {
        iq.attrs.type = 'error'
        iq.append(child.clone())
        if (err instanceof xml.Element) {
          iq.append(err)
        } else if (err) {
          iq.append(
            xml(
              'error',
              {type: 'cancel'},
              xml('internal-server-error', NS_STANZA)
            )
          )
        }
        ctx.response = iq
        next()
      })
  }
}

// Module.exports = function(getters, setters, entity) {
//   return function({name, id, type, from, stanza}, next) {
//     if (name !== 'iq') return next()
//     if (type !== 'get' || type !== 'set') return next()
//     if (!id) return next()

//     const iq = xml('iq', {
//       to: from,
//       id,
//     })

//     const [child] = stanza.children
//     const handler = (type === 'get' ? getters : setters)[child.attrs.xmlns]

//     if (!handler) {
//       iq.attrs.type = 'error'
//       iq.append(child.clone())
//       iq.append(
//         xml('error', {type: 'cancel'}, xml('service-unvailable', NS_STANZA))
//       )
//       entity.send(iq)
//       return next()
//     }

//     Promise.resolve(handler(child))
//       .then(el => {
//         iq.attrs.type = 'result'
//         if (el) {
//           iq.append(el)
//         }
//         entity.send(iq)
//         next()
//       })
//       .catch(err => {
//         iq.attrs.type = 'error'
//         iq.append(child.clone())
//         if (err instanceof xml.Element) {
//           iq.append(err)
//         } else if (err) {
//           iq.append(
//             xml(
//               'error',
//               {type: 'cancel'},
//               xml('internal-server-error', NS_STANZA)
//             )
//           )
//         }
//         entity.send(iq)
//         next()
//       })
//   }
// }
