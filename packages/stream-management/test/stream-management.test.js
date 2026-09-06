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

test("handles queue desync after page reload (empty queue, server h > 0)", async () => {
  // Simulates page reload scenario:
  // - Client previously sent stanzas, server acked them
  // - Page reloads: outbound_q is lost, outbound resets to 0
  // - On resume, server sends <a h="N"/> with the real counter
  // - Client must handle this without crashing and resync counter
  const { entity } = mockClient();

  entity.streamManagement.enabled = true;
  entity.streamManagement.outbound = 0;
  entity.streamManagement.outbound_q = []; // Empty queue (lost on reload)

  // Server thinks it acked 50 stanzas, but our queue is empty
  entity.mockInput(<a xmlns="urn:xmpp:sm:3" h="50" />);
  await tick();

  // Should not crash and should resync counter to server's value
  expect(entity.streamManagement.outbound).toBe(50);
  expect(entity.streamManagement.outbound_q).toHaveLength(0);
});

test("handles partial queue desync (some items in queue, server h higher)", async () => {
  // Queue has fewer items than server's h value indicates
  const { entity } = mockClient();

  entity.streamManagement.enabled = true;
  entity.streamManagement.outbound = 0;

  // Send 2 messages
  await entity.send(<message id="a" />);
  await entity.send(<message id="b" />);

  expect(entity.streamManagement.outbound_q).toHaveLength(2);

  let acks = 0;
  entity.streamManagement.on("ack", () => {
    acks++;
  });

  // Server claims h=5 but we only have 2 in queue
  entity.mockInput(<a xmlns="urn:xmpp:sm:3" h="5" />);
  await tick();

  // Should ack the 2 we have and resync to server's value
  expect(acks).toBe(2);
  expect(entity.streamManagement.outbound).toBe(5);
  expect(entity.streamManagement.outbound_q).toHaveLength(0);
});
