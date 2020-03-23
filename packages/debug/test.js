"use strict";

const test = require("ava");
const { hideSensitive } = require(".");

test("SASL", (t) => {
  t.deepEqual(
    hideSensitive(<auth xmlns="urn:ietf:params:xml:ns:xmpp-sasl">foo</auth>),
    <auth xmlns="urn:ietf:params:xml:ns:xmpp-sasl">
      <hidden xmlns="xmpp.js" />
    </auth>,
  );

  t.deepEqual(
    hideSensitive(
      <challenge xmlns="urn:ietf:params:xml:ns:xmpp-sasl">foo</challenge>,
    ),
    <challenge xmlns="urn:ietf:params:xml:ns:xmpp-sasl">
      <hidden xmlns="xmpp.js" />
    </challenge>,
  );

  t.deepEqual(
    hideSensitive(
      <response xmlns="urn:ietf:params:xml:ns:xmpp-sasl">foo</response>,
    ),
    <response xmlns="urn:ietf:params:xml:ns:xmpp-sasl">
      <hidden xmlns="xmpp.js" />
    </response>,
  );

  t.deepEqual(
    hideSensitive(
      <success xmlns="urn:ietf:params:xml:ns:xmpp-sasl">foo</success>,
    ),
    <success xmlns="urn:ietf:params:xml:ns:xmpp-sasl">
      <hidden xmlns="xmpp.js" />
    </success>,
  );
});

test("component handshake", (t) => {
  t.deepEqual(
    hideSensitive(<handshake xmlns="jabber:component:accept">foo</handshake>),
    <handshake xmlns="jabber:component:accept">
      <hidden xmlns="xmpp.js" />
    </handshake>,
  );
});
