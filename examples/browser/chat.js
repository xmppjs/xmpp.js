try {
var xmpp = require('node-xmpp');
} catch (e) {
    console.error(e.stack || e);
}
var cl = new xmpp.Client({ websocketsURL: "ws://localhost:5280/",
			   jid: 'test@example.com',
                           password: '***' });
cl.addListener('online',
               function() {
                   ["astro@spaceboyz.net"].forEach(
                       function(to) {
                           cl.send(new xmpp.Element('message',
                                                    { to: to,
                                                      type: 'chat'}).
                                   c('body').
                                   t("Hello from browser"));
                       });

                   // nodejs has nothing left to do and will exit
                   cl.end();
               });
cl.addListener('error',
               function(e) {
                   console.error(e);
               });
