// FIXME move to its own module?

export function encode (string) {
  if (!global.Buffer) return global.atob(string)

  return (Buffer.from
    ? Buffer.from(string, 'utf8')
    : new Buffer(string, 'utf8')
  ).toString('base64')
}

export function decode (string) {
  if (!global.Buffer) return global.btoa(string)

  return (Buffer.from
    ? Buffer.from(string, 'base64')
    : new Buffer(string, 'base64')
  ).toString('utf8')
}

export default {encode, decode}
