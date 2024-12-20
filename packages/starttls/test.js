"use strict";

const { mock, stub } = require("sinon");
const { mockClient, promise, delay } = require("@xmpp/test");
const tls = require("tls");
const net = require("net");
const EventEmitter = require("events");

function mockSocket() {
  const socket = new net.Socket();
  socket.write = (data, cb) => cb();
  return socket;
}

test("success", async () => {
  const { entity } = mockClient();
  entity.socket = mockSocket();
  const { socket, options } = entity;
  options.domain = "foobar";

  const mockTLS = mock(tls);
  const expectTLSConnect = mockTLS
    .expects("connect")
    .once()
    .withArgs({ socket, host: "foobar" })
    .callsFake(() => {
      return new EventEmitter();
    });

  stub(entity, "_attachSocket");
  stub(entity, "restart");

  entity.mockInput(
    <features xmlns="http://etherx.jabber.org/streams">
      <starttls xmlns="urn:ietf:params:xml:ns:xmpp-tls" />
    </features>,
  );

  expect(await promise(entity, "send")).toEqual(<starttls xmlns="urn:ietf:params:xml:ns:xmpp-tls" />);

  entity.mockInput(<proceed xmlns="urn:ietf:params:xml:ns:xmpp-tls" />);

  await delay();

  expectTLSConnect.verify();
});

test("failure", async () => {
  const { entity } = mockClient();
  entity.socket = mockSocket();

  entity.mockInput(
    <features xmlns="http://etherx.jabber.org/streams">
      <starttls xmlns="urn:ietf:params:xml:ns:xmpp-tls" />
    </features>,
  );

  expect(await promise(entity, "send")).toEqual(<starttls xmlns="urn:ietf:params:xml:ns:xmpp-tls" />);

  entity.mockInput(<failure xmlns="urn:ietf:params:xml:ns:xmpp-tls" />);

  const err = await promise(entity, "error");
  expect(err instanceof Error).toBe(true);
  expect(err.message).toBe("STARTTLS_FAILURE");
});
