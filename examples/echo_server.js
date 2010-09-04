var xmpp = require('../lib/xmpp');

var r = new xmpp.Router();
r.send(new xmpp.Element('message', { from: 'test@codetu.be',
				     to: 'astro@spaceboyz.net',
				     type: 'chat' }).
       c('body').t('Hello, World')
      );
