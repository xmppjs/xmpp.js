/**
 * This example establishes some s2s connections over time. It is a
 * router test. You must modify it!
 */
var xmpp = require('../lib/node-xmpp');

var MY_JID = 'codetu.be';
var r = new xmpp.Router();
r.loadCredentials('codetu.be', 'codetube.key', 'codetube.crt');

r.register(MY_JID, function(stanza) {
    var time = Date.now();
    var query;

    if (stanza.is('iq') &&
	stanza.attrs.type == 'result' &&
	(query = stanza.getChild('query', 'jabber:iq:version'))) {

	var name = query.getChildText('name');
	var version = query.getChildText('version');
	var os = query.getChildText('os');
	console.log(time + " >> " + stanza.attrs.from + " " +
		    [name, version, os].join('/'));
    } else if (stanza.is('iq') &&
	       stanza.attrs.type == 'error') {
	console.log(time + " !! " + stanza.attrs.from);
    } else {
	console.log(time + " ?? " + stanza.toString());
    }
});
process.on('SIGINT', function() {
    r.unregister(MY_JID);
    process.nextTick(function() {
	process.exit(0);
    });
});


var PROBE_DOMAINS = ["spaceboyz.net", "jabber.ccc.de",
		     "gmail.com", "jabber.org",
		     "jabbim.cz", "jabber.ru",
		     "process-one.net", "gtalk2voip.com",
		     "swissjabber.ch", "aspsms.swissjabber.ch",
		     "icq.hq.c3d2.de", "codetu.be",
		     "webkeks.org"];
function probe() {
    setTimeout(probe, Math.floor((Math.random() * 15 + 5) * 1000));

    var to = PROBE_DOMAINS[Math.floor(Math.random() * PROBE_DOMAINS.length)];
    r.send(new xmpp.Element('iq', { type: 'get',
				    to: to,
				    from: MY_JID
				  }).
	   c('query', { xmlns: 'jabber:iq:version' })
	  );
}
probe();
