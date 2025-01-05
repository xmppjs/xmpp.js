import { mockClient } from "@xmpp/test";

test("enable", async () => {
  const { entity, streamManagement: sm } = mockClient();

  entity.mockInput(
    <features xmlns="http://etherx.jabber.org/streams">
      <authentication xmlns="urn:xmpp:sasl:2">
        <mechanism>PLAIN</mechanism>
        <inline>
          <bind xmlns="urn:xmpp:bind:0">
            <inline>
              <feature var="urn:xmpp:sm:3" />
            </inline>
          </bind>
          <sm xmlns="urn:xmpp:sm:3" />
        </inline>
      </authentication>
    </features>,
  );

  const stanza_out = await entity.catchOutgoing();
  const enable = stanza_out
    .getChild("bind", "urn:xmpp:bind:0")
    .getChild("enable");
  enable.parent = null;
  expect(enable).toEqual(<enable xmlns="urn:xmpp:sm:3" resume="true" />);

  expect(sm.enabled).toBe(false);
  expect(sm.id).toBe("");
  expect(sm.max).toBe(null);

  entity.mockInput(
    <success xmlns="urn:xmpp:sasl:2">
      <bound xmlns="urn:xmpp:bind:0">
        <enabled resume="1" xmlns="urn:xmpp:sm:3" id="2j44j2" max="600" />
      </bound>
    </success>,
  );

  expect(sm.enabled).toBe(true);
  expect(sm.id).toBe("2j44j2");
  expect(sm.max).toBe("600");
});

// https://xmpp.org/extensions/xep-0198.html#example-29
test("Client failed to enable stream management", async () => {
  const { entity, streamManagement: sm } = mockClient();

  entity.mockInput(
    <features xmlns="http://etherx.jabber.org/streams">
      <authentication xmlns="urn:xmpp:sasl:2">
        <mechanism>PLAIN</mechanism>
        <inline>
          <bind xmlns="urn:xmpp:bind:0">
            <inline>
              <feature var="urn:xmpp:sm:3" />
            </inline>
          </bind>
          <sm xmlns="urn:xmpp:sm:3" />
        </inline>
      </authentication>
    </features>,
  );

  const stanza_out = await entity.catchOutgoing();
  const enable = stanza_out
    .getChild("bind", "urn:xmpp:bind:0")
    .getChild("enable");
  enable.parent = null;
  expect(enable).toEqual(<enable xmlns="urn:xmpp:sm:3" resume="true" />);

  expect(sm.enabled).toBe(false);
  expect(sm.id).toBe("");
  expect(sm.max).toBe(null);

  entity.mockInput(
    <success xmlns="urn:xmpp:sasl:2">
      <bound xmlns="urn:xmpp:bind:0">
        <failed xmlns="urn:xmpp:sm:3">
          <internal-server-error xmlns="urn:ietf:params:xml:ns:xmpp-stanzas" />
        </failed>
      </bound>
    </success>,
  );

  expect(sm.enabled).toBe(false);
  expect(sm.id).toBe("");
  expect(sm.max).toBe(null);
});
