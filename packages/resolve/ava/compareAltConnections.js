'use strict'

const test = require('ava')
const compare = require('../lib/alt-connections').compare

test('by security', t => {
  t.deepEqual(
    [
      {url: 'http://web.example.org:5280/bosh', method: 'xbosh'},
      {url: 'https://web.example.org:5280/bosh', method: 'xbosh'},
    ].sort(compare),
    [
      {url: 'https://web.example.org:5280/bosh', method: 'xbosh'},
      {url: 'http://web.example.org:5280/bosh', method: 'xbosh'},
    ]
  )

  t.deepEqual(
    [
      {url: 'ws://web.example.com:80/ws', method: 'websocket'},
      {url: 'https://web.example.org:5280/bosh', method: 'xbosh'},
    ].sort(compare),
    [
      {url: 'https://web.example.org:5280/bosh', method: 'xbosh'},
      {url: 'ws://web.example.com:80/ws', method: 'websocket'},
    ]
  )
})

test('by method', t => {
  t.deepEqual(
    [
      {url: 'https://web.example.org:5280/http-poll', method: 'httppoll'},
      {url: 'wss://web.example.com:443/ws', method: 'websocket'},
      {url: 'https://web.example.org:5280/bosh', method: 'xbosh'},
    ].sort(compare),
    [
      {url: 'wss://web.example.com:443/ws', method: 'websocket'},
      {url: 'https://web.example.org:5280/bosh', method: 'xbosh'},
      {url: 'https://web.example.org:5280/http-poll', method: 'httppoll'},
    ]
  )
})
