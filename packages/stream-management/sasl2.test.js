import { mockClient } from "@xmpp/test";

test("resume", async () => {
  const { entity, streamManagement: sm } = mockClient();

  sm.id = Math.random().toString().slice(2);

  entity.mockInput(
    <features xmlns="http://etherx.jabber.org/streams">
      <authentication xmlns="urn:xmpp:sasl:2">
        <mechanism>PLAIN</mechanism>
        <inline>
          <sm xmlns="urn:xmpp:sm:3" />
        </inline>
      </authentication>
    </features>,
  );

  sm.outbound = 45;
  sm.inbound = 54;

  // eslint-disable-next-line unicorn/no-await-expression-member
  const element_resume = (await entity.catchOutgoing()).getChild("resume");
  element_resume.parent = null;
  expect(element_resume).toEqual(
    <resume xmlns="urn:xmpp:sm:3" h="0" previd={sm.id} />,
  );

  entity.mockInput(
    <success xmlns="urn:xmpp:sasl:2">
      <resumed xmlns="urn:xmpp:sm:3" previd={sm.id} h="0" />
    </success>,
  );

  expect(entity.streamManagement.outbound).toBe(45);
  expect(entity.streamManagement.inbound).toBe(54);
  expect(entity.streamManagement.enabled).toBe(true);
});

// https://xmpp.org/extensions/xep-0198.html#example-30
test("Client failed to resume stream", async () => {
  const { entity, streamManagement: sm } = mockClient();

  sm.id = Math.random().toString().slice(2);

  entity.mockInput(
    <features xmlns="http://etherx.jabber.org/streams">
      <authentication xmlns="urn:xmpp:sasl:2">
        <mechanism>PLAIN</mechanism>
        <inline>
          <sm xmlns="urn:xmpp:sm:3" />
        </inline>
      </authentication>
    </features>,
  );

  sm.outbound = 45;
  sm.inbound = 54;

  // eslint-disable-next-line unicorn/no-await-expression-member
  const element_resume = (await entity.catchOutgoing()).getChild("resume");
  element_resume.parent = null;
  expect(element_resume).toEqual(
    <resume xmlns="urn:xmpp:sm:3" h="0" previd={sm.id} />,
  );

  entity.mockInput(
    <success xmlns="urn:xmpp:sasl:2">
      <failed xmlns="urn:xmpp:sm:3" h="another-sequence-number">
        <item-not-found xmlns="urn:ietf:params:xml:ns:xmpp-stanzas" />
      </failed>
    </success>,
  );

  expect(entity.streamManagement.outbound).toBe(0);
  expect(entity.streamManagement.inbound).toBe(54);
  expect(entity.streamManagement.enabled).toBe(false);
});
