import { mockClient, promise, timeout } from "@xmpp/test";
import sessionEstablishment from "./index.js";

test("mandatory", async () => {
  const { entity } = mockClient();
  sessionEstablishment(entity);

  entity.mockInput(
    <features xmlns="http://etherx.jabber.org/streams">
      <session xmlns="urn:ietf:params:xml:ns:xmpp-session" />
    </features>,
  );

  entity.scheduleIncomingResult();

  const child = await entity.catchOutgoingSet();
  expect(child).toEqual(
    <session xmlns="urn:ietf:params:xml:ns:xmpp-session" />,
  );
});

test("optional", async () => {
  const { entity } = mockClient();
  sessionEstablishment(entity);

  entity.mockInput(
    <features xmlns="http://etherx.jabber.org/streams">
      <session xmlns="urn:ietf:params:xml:ns:xmpp-session">
        <optional />
      </session>
    </features>,
  );

  const promiseSend = promise(entity, "send");

  await timeout(promiseSend, 0).catch((err) => {
    expect(err.name).toBe("TimeoutError");
  });
});
