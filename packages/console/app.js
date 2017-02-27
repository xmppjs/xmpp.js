#!/usr/bin/env node

'use strict'

process.title = '@xmpp/console'

const meow = require('meow')

const cli = meow(`
    Usage
      $ xmpp-console jid [password] [endpoint]

    Options
      --port, -p 8080 port for the web interface
      --web, -w use web interface
      --no-open, prevents opening the url for the web interface
      --type, -t client, component, c2s or s2s

    Examples
      $ xmpp-console user@localhost[/resource] password --no-open --port 8000 --web
      $ xmpp-console anon.localhost '' xmpp://localhost:5222
      $ xmpp-console user@localhost[/resource] password xmpp://localhost[:port]
      $ xmpp-console user@localhost[/resource] password xmpps://localhost[:port]
      $ xmpp-console user@localhost[/resource] password ws://localhost:5280/xmpp-websocket
      $ xmpp-console user@localhost[/resource] password wss://localhost:5281/xmpp-websocket
      $ xmpp-console component.localhost password
`, {
  alias: {
    p: 'port',
    w: 'web',
    t: 'type'
  }
})

const [jid, password, endpoint] = cli.input
const params = {jid, password, endpoint}

const int = cli.flags.web ? './web' : './cli'
require(int)(cli.flags, params)

process.on('unhandledRejection', (reason) => {
  console.error(reason)
  process.exit(1)
})
