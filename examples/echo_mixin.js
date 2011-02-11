/**
 * Demonstrates how the echo behavior can be abstracted into a decorator, 
 * working equally well on clients, components or S2S.
*/
var sys = require('sys');
var xmpp = require('../lib/node-xmpp');
var argv = process.argv;

if (argv.length < 5 && argv) {
    sys.puts('Usage: node echo_mixin.js client <my-jid> <my-password>');
    sys.puts('Or: node echo_mixin.js component <my-jid> <my-password> <host> <port>');
    process.exit(1);
}

function echoMixin(connection) {
  connection.on('stanza',
    function(stanza) {
      if (stanza.is('message') &&
        // Important: never reply to errors!
        stanza.attrs.type !== 'error') {
        // Swap addresses...
        stanza.attrs.to = stanza.attrs.from;
        delete stanza.attrs.from;
        // and send back.
        connection.send(stanza);
      }
  });
}

function errorMixin(connection) {
  connection.on('error',
    function(e) {
      sys.puts(e);
  });
}

var cl = null;
if(argv[2] == "client")
  cl = new xmpp.Client({ jid: argv[3],
    password: argv[4]});
else
  cl = new xmpp.Component({ jid: argv[3],
    password: argv[4],
    host: argv[5],
    port: argv[6] });

cl.on('online',
      function() {
	  cl.send(new xmpp.Element('presence',
				   { type: 'chat'}).
		  c('show').t('chat').up().
		  c('status').t('Happily echoing your <message/> stanzas')
		 );
      });

cl.addMixin(echoMixin);
cl.addMixin(errorMixin);
