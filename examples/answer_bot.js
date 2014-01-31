'use strict';


/*
 * example usage:
 *
 * node examples/answer_bot.js me@evilprofessor.co.uk password component.evilprofessor.co.uk
 *
 * Chats with the example component in example/send_message_component.js
 */

var Client = require('node-xmpp-client')
  , argv = process.argv
  , ltx = require('ltx')

if (argv.length < 5) {
    console.error('Usage: node answer_bot.js <my-jid> <my-password> ' +
        '<component-jid>')
    process.exit(1)
}

var component = argv[4]
  , client = new Client({
    jid: argv[2],
    password: argv[3],
    reconnect: true
})

client.on('online', function() {

    console.log('Component is online')

    client.on('stanza', function(stanza) {
        console.log('Received stanza: ', stanza.toString())
        if (stanza.is('message')) {
            var i = parseInt(stanza.getChildText('body'))
            var reply = new ltx.Element('message', {
                to: stanza.attrs.from,
                from: stanza.attrs.to,
                type: 'chat'
            })
            reply.c('body').t(isNaN(i) ? 'i can count!' : ('' + (i + 1)))
            setTimeout(function () {
                client.send(reply)
            }, 321)
        }
    })

    setTimeout(function () {
        console.log('Start chatting …')
        var reply = new ltx.Element('message', {
            to: component,
            type: 'chat'
        })
        reply.c('body').t('0')
        client.send(reply)
    }, 321)

})

client.on('error', function(e) {
    console.error(e)
    process.exit(1)
})

process.on('exit', function () {
    client.end()
})
