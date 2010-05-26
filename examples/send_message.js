require.paths.push('../lib');
var sys = require('sys');
var xmpp = require('xmpp');
var argv = process.argv;

if (argv.length < 6) {
    sys.puts('Usage: node send_message.js <my-jid> <my-password> <my-text> <jid1> [jid2] ... [jidN]');
    process.exit(1);
}

var cl = new xmpp.Client({ jid: argv[2],
			   password: argv[3] });
cl.addListener('online',
	       function() {
		   argv.slice(5).forEach(
		       function(to) {
			   cl.send(new xmpp.XML.Element('message',
							{ to: to,
							  type: 'chat'}).
				   c('body').
				   t(argv[4]));
		       });
		   cl.end();
	       });
