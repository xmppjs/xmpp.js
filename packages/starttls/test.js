jest.mock("tls");

import tls from "node:tls";

import { mockClient, promise, delay, mockSocket } from "@xmpp/test";
import { EventEmitter } from "@xmpp/events";

test("success", async () => {
  const { entity } = mockClient();
  entity.socket = mockSocket();
  const { socket, options } = entity;
  options.domain = "foobar";

  tls.connect.mockImplementation(() => {
    return new EventEmitter();
  });

  entity.mockInput(
    <features xmlns="http://etherx.jabber.org/streams">
      <starttls xmlns="urn:ietf:params:xml:ns:xmpp-tls" />
    </features>,
  );

  expect(await promise(entity, "send")).toEqual(
    <starttls xmlns="urn:ietf:params:xml:ns:xmpp-tls" />,
  );

  entity.mockInput(<proceed xmlns="urn:ietf:params:xml:ns:xmpp-tls" />);

  await delay();

  expect(tls.connect).toHaveBeenCalledTimes(1);
  expect(tls.connect).toHaveBeenCalledWith({ socket, host: "foobar" });
});

test("failure", async () => {
  const { entity } = mockClient();
  entity.socket = mockSocket();

  entity.mockInput(
    <features xmlns="http://etherx.jabber.org/streams">
      <starttls xmlns="urn:ietf:params:xml:ns:xmpp-tls" />
    </features>,
  );

  expect(await promise(entity, "send")).toEqual(
    <starttls xmlns="urn:ietf:params:xml:ns:xmpp-tls" />,
  );

  entity.mockInput(<failure xmlns="urn:ietf:params:xml:ns:xmpp-tls" />);

  const err = await promise(entity, "error");
  expect(err instanceof Error).toBe(true);
  expect(err.message).toBe("STARTTLS_FAILURE");
});
