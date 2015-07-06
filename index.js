'use strict';

var Connection = require('node-xmpp-core').Connection
  , Client = require('node-xmpp-client')
  , Component = require('node-xmpp-component')
  , C2SServer = require('node-xmpp-server').C2SServer
  , C2SStream = require('node-xmpp-server').C2SStream
  , JID = require('node-xmpp-core').JID
  , Router = require('node-xmpp-server').Router
  , ltx = require('node-xmpp-core').ltx
  , Stanza = require('node-xmpp-core').Stanza

module.exports = {
    Connection: Connection,
    Client: Client,
    Component: Component,
    C2SServer: C2SServer,
    C2SStream: C2SStream,
    JID: JID,
    Element: ltx.Element,
    Stanza: Stanza.Stanza,
    Message: Stanza.Message,
    Presence: Stanza.Presence,
    Iq: Stanza.Iq,
    ltx: ltx,
    Router: Router,
    BOSHServer: require('node-xmpp-server').BOSHServer,
    StreamParser: require('node-xmpp-core').StreamParser
}