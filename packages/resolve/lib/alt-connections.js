'use strict'

function isSecure(uri) {
  return uri.startsWith('https') || uri.startsWith('wss')
}

module.exports.compare = function compare(a, b) {
  let secure
  if (isSecure(a.uri) && !isSecure(b.uri)) {
    secure = -1
  } else if (!isSecure(a.uri) && isSecure(b.uri)) {
    secure = 1
  } else {
    secure = 0
  }
  if (secure !== 0) {
    return secure
  }

  let method
  if (a.method === b.method) {
    method = 0
  } else if (a.method === 'websocket') {
    method = -1
  } else if (b.method === 'websocket') {
    method = 1
  } else if (a.method === 'xbosh') {
    method = -1
  } else if (b.method === 'xbosh') {
    method = 1
  } else if (a.method === 'httppoll') {
    method = -1
  } else if (b.method === 'httppoll') {
    method = 1
  } else {
    method = 0
  }
  if (method !== 0) {
    return method
  }

  return 0
}
