'use strict'

const http = require('http')

const doc = `
<?xml version='1.0' encoding=utf-8'?>
<XRD xmlns='http://docs.oasis-open.org/ns/xri/xrd-1.0'>
  <Link rel="urn:xmpp:alt-connections:xbosh"
        href="https://web.example.com:5280/bosh"/>
  <Link rel="urn:xmpp:alt-connections:websocket"
        href="wss://web.example.com:443/ws"/>
</XRD>
`

var server = http.createServer()
server.on('request', (req, res) => {
  if (req.url === '/.well-known/host-meta') {
    res.writeHead(200)
    res.end(doc, 'utf8')
  }
})

server.listen(80)
