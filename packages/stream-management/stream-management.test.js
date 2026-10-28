import { mockClient } from "@xmpp/test";
import { tick } from "@xmpp/events";

test("emits ack when the server ackownledge stanzas", async () => {
  const { entity } = mockClient();

  entity.streamManagement.enabled = true;

  expect(entity.streamManagement.outbound).toBe(0);
  expect(entity.streamManagement.outbound_q).toBeEmpty();
  // expect(entity.streamManagement.enabled).toBe(true);

  await entity.send(<message id="a" />);

  expect(entity.streamManagement.outbound).toBe(0);
  expect(entity.streamManagement.outbound_q).toHaveLength(1);

  let acks = 0;
  entity.streamManagement.on("ack", (stanza) => {
    expect(stanza.attrs.id).toBe("a");
    acks++;
  });

  entity.mockInput(<a xmlns="urn:xmpp:sm:3" h="1" />);
  await tick();

  expect(acks).toBe(1);
  expect(entity.streamManagement.outbound).toBe(1);
  expect(entity.streamManagement.outbound_q).toHaveLength(0);
});

test("does not throw when the server acknowledges more stanzas than were sent", async () => {
  const { entity } = mockClient();
  entity.streamManagement.enabled = true;

  await entity.send(<message id="a" />);
  expect(entity.streamManagement.outbound_q).toHaveLength(1);

  const acks = [];
  entity.streamManagement.on("ack", (stanza) => acks.push(stanza));

  // The server acknowledges 5 stanzas although only one was queued, for
  // instance when its 'h' counter is desynchronised after resuming a stream.
  entity.mockInput(<a xmlns="urn:xmpp:sm:3" h="5" />);
  await tick();

  expect(acks).toHaveLength(1);
  expect(acks[0].attrs.id).toBe("a");
  expect(entity.streamManagement.outbound).toBe(1);
  expect(entity.streamManagement.outbound_q).toHaveLength(0);
});

test("sends an <a/> element before closing", async () => {
  const { entity, streamManagement } = mockClient();
  streamManagement.enabled = true;
  streamManagement.inbound = 42;
  entity.status = "online";

  const promise_disconnect = entity.disconnect();

  expect(await entity.catchOutgoing()).toEqual(
    <a xmlns="urn:xmpp:sm:3" h={streamManagement.inbound} />,
  );

  await promise_disconnect;
});
