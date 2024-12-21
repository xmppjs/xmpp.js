import { hideSensitive } from "./index.js";

test("SASL", () => {
  expect(
    hideSensitive(<auth xmlns="urn:ietf:params:xml:ns:xmpp-sasl">foo</auth>),
  ).toEqual(
    <auth xmlns="urn:ietf:params:xml:ns:xmpp-sasl">
      <hidden xmlns="xmpp.js" />
    </auth>,
  );

  expect(
    hideSensitive(
      <challenge xmlns="urn:ietf:params:xml:ns:xmpp-sasl">foo</challenge>,
    ),
  ).toEqual(
    <challenge xmlns="urn:ietf:params:xml:ns:xmpp-sasl">
      <hidden xmlns="xmpp.js" />
    </challenge>,
  );

  expect(
    hideSensitive(
      <response xmlns="urn:ietf:params:xml:ns:xmpp-sasl">foo</response>,
    ),
  ).toEqual(
    <response xmlns="urn:ietf:params:xml:ns:xmpp-sasl">
      <hidden xmlns="xmpp.js" />
    </response>,
  );

  expect(
    hideSensitive(
      <success xmlns="urn:ietf:params:xml:ns:xmpp-sasl">foo</success>,
    ),
  ).toEqual(
    <success xmlns="urn:ietf:params:xml:ns:xmpp-sasl">
      <hidden xmlns="xmpp.js" />
    </success>,
  );
});

test("component handshake", () => {
  expect(
    hideSensitive(<handshake xmlns="jabber:component:accept">foo</handshake>),
  ).toEqual(
    <handshake xmlns="jabber:component:accept">
      <hidden xmlns="xmpp.js" />
    </handshake>,
  );
});
