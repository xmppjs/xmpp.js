#!/usr/bin/env node

'use strict'

process.title = '@xmpp/console'

const meow = require('meow')

const cli = meow(
  `
    Usage
      $ xmpp-console [endpoint]

    Options
      --port, -p 8080 port for the web interface
      --web, -w use web interface
      --no-open, prevents opening the url for the web interface
      --type, -t client (default) or component

    Examples
      $ xmpp-console localhost (auto)
      $ xmpp-console xmpp://localhost[:5222] (classic XMPP)
      $ xmpp-console xmpps://localhost[:5223] (direct TLS)
      $ xmpp-console ws://localhost:5280/xmpp-websocket (WebSocket)
      $ xmpp-console wss://localhost:52801/xmpp-websocket (Secure WebSocket)
      $ xmpp-console xmpp://component.localhost[:5347] --type component (component)
`,
  {
    alias: {
      p: 'port',
      w: 'web',
      t: 'type',
    },
  }
)

const [endpoint] = cli.input

const int = cli.flags.web ? './web' : './cli'
if (!cli.flags.type) {
  cli.flags.type = 'client'
}
require(int)(cli.flags, endpoint)

process.on('unhandledRejection', reason => {
  throw reason
})
