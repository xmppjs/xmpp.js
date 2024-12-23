import { mockClient, delay } from "@xmpp/test";

test("without resource", async () => {
  const resource = Math.random().toString();
  const jid = "foo@bar/" + resource;

  const { entity } = mockClient();

  entity.mockInput(
    <features xmlns="http://etherx.jabber.org/streams">
      <bind xmlns="urn:ietf:params:xml:ns:xmpp-bind" />
    </features>,
  );

  entity.scheduleIncomingResult(
    <bind xmlns="urn:ietf:params:xml:ns:xmpp-bind">
      <jid>{jid}</jid>
    </bind>,
  );

  const child = await entity.catchOutgoingSet();
  expect(child).toEqual(<bind xmlns="urn:ietf:params:xml:ns:xmpp-bind" />);

  await delay();

  expect(entity.jid.toString()).toBe(jid);
});

test("with string resource", async () => {
  const resource = Math.random().toString();
  const jid = "foo@bar/" + resource;

  const { entity } = mockClient({ resource });

  entity.mockInput(
    <features xmlns="http://etherx.jabber.org/streams">
      <bind xmlns="urn:ietf:params:xml:ns:xmpp-bind" />
    </features>,
  );

  entity.scheduleIncomingResult(
    <bind xmlns="urn:ietf:params:xml:ns:xmpp-bind">
      <jid>{jid}</jid>
    </bind>,
  );

  const child = await entity.catchOutgoingSet();
  expect(child).toEqual(
    <bind xmlns="urn:ietf:params:xml:ns:xmpp-bind">
      <resource>{resource}</resource>
    </bind>,
  );

  await delay();

  expect(entity.jid.toString()).toBe(jid);
});

test("with function resource", async () => {
  const resource = Math.random().toString();
  const jid = "foo@bar/" + resource;

  const { entity } = mockClient({
    resource: async () => {
      return resource;
    },
  });

  entity.mockInput(
    <features xmlns="http://etherx.jabber.org/streams">
      <bind xmlns="urn:ietf:params:xml:ns:xmpp-bind" />
    </features>,
  );

  entity.scheduleIncomingResult(
    <bind xmlns="urn:ietf:params:xml:ns:xmpp-bind">
      <jid>{jid}</jid>
    </bind>,
  );

  const child = await entity.catchOutgoingSet();
  expect(child).toEqual(
    <bind xmlns="urn:ietf:params:xml:ns:xmpp-bind">
      <resource>{resource}</resource>
    </bind>,
  );

  await delay();

  expect(entity.jid.toString()).toBe(jid);
});
