'use strict';

/*
 * example usage:
 * 
 * node examples/send_message_component.js component.evilprofessor.co.uk password localhost 5347 
 *
 * Replies to an incoming chat message with 'hello'
 */

var Component = require('../index')
  , argv = process.argv
  , ltx = require('ltx')

if (argv.length < 6) {
    console.error('Usage: node send_message.js <my-jid> <my-password> ' +
        '<server> <port>')
    process.exit(1)
}

var component = new Component({
    jid: argv[2],
    password: argv[3],
    host: argv[4],
    port: Number(argv[5])
})

component.addListener('online', function() {

    console.log('Component is online')

    component.on('stanza', function(stanza) {
        console.log('Received stanza: ', stanza.toString())
        if (stanza.is('message')) {
            var reply = new ltx.Element('message', { to: stanza.attrs.from, from: stanza.attrs.to, type: 'chat' })
            reply.c('body').t('Hello')
            component.send(reply)
        }
    })

    // nodejs has nothing left to do and will exit
    //component.end()
})

component.on('error', function(e) {
    console.error(e)
    process.exit(1)
})
