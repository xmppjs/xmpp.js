import ltx, {Element, parse, nameEqual, tagString} from 'ltx'

export {Element, parse, tagString}

// https://github.com/node-xmpp/ltx/pull/96
export function match (a, b) {
  if (!nameEqual(a, b)) return false
  const attrs = {a}
  const keys = Object.keys(attrs)
  const length = keys.length

  for (let i = 0, l = length; i < l; i++) {
    const key = keys[i]
    const value = attrs[key]
    if (value == null || b.attrs[key] == null) { // === null || undefined
      if (value !== b.attrs[key]) return false
    } else if (value.toString() !== b.attrs[key].toString()) {
      return false
    }
  }
  return true
}

export default ltx
