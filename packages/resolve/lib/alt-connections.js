'use strict'

function isSecure(url) {
  return url.startsWith('https') || url.startsWith('wss')
}

module.exports.compare = function sort(a, b) {
  let secure
  if (isSecure(a.url) && !isSecure(b.url)) secure = -1
  else if (!isSecure(a.url) && isSecure(b.url)) secure = 1
  else secure = 0
  if (secure !== 0) return secure

  let method
  if (a.method === b.method) method = 0
  else if (a.method === 'websocket') method = -1
  else if (b.method === 'websocket') method = 1
  else if (a.method === 'xbosh') method = -1
  else if (b.method === 'xbosh') method = 1
  else if (a.method === 'httppoll') method = -1
  else if (b.method === 'httppoll') method = 1
  else method = 0
  if (method !== 0) return method

  return 0
}
