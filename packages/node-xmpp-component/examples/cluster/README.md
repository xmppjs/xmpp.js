cluster example
===================================

> A single instance of Node.js runs in a single thread. To take advantage of multi-core systems the user will sometimes want to launch a cluster of processes to handle the load.

[Node.js cluster](http://nodejs.org/api/cluster.html)

This is an example on how to leverage this feature and make a scalable and multi process XMPP component.

You will need an XMPP server with component balancing support.
* [ejabberd](https://www.ejabberd.im/)
* [MongooseIM](https://www.erlang-solutions.com/products/mongooseim-massively-scalable-ejabberd-platform)
* [Prosody](http://prosody.im/) with [mod_component_roundrobin](https://code.google.com/p/prosody-modules/wiki/mod_component_roundrobin)

Edit `config.js` to match the server configuration and start with
```
npm server.js
```
