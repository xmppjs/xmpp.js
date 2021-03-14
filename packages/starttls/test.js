"use strict";

const { mock, stub } = require("sinon");
const test = require("ava");
const { mockClient, promise, delay } = require("@xmpp/test");
const tls = require("tls");
const net = require("net");
const EventEmitter = require("events");

function mockSocket() {
  const socket = new net.Socket();
  socket.write = (data, cb) => cb();
  return socket;
}

test("success", async (t) => {
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

  t.deepEqual(
    await promise(entity, "send"),
    <starttls xmlns="urn:ietf:params:xml:ns:xmpp-tls" />,
  );

  entity.mockInput(<proceed xmlns="urn:ietf:params:xml:ns:xmpp-tls" />);

  await delay();

  expectTLSConnect.verify();
});

test("failure", async (t) => {
  const { entity } = mockClient();
  entity.socket = mockSocket();

  entity.mockInput(
    <features xmlns="http://etherx.jabber.org/streams">
      <starttls xmlns="urn:ietf:params:xml:ns:xmpp-tls" />
    </features>,
  );

  t.deepEqual(
    await promise(entity, "send"),
    <starttls xmlns="urn:ietf:params:xml:ns:xmpp-tls" />,
  );

  entity.mockInput(<failure xmlns="urn:ietf:params:xml:ns:xmpp-tls" />);

  const err = await promise(entity, "error");
  t.true(err instanceof Error);
  t.is(err.message, "STARTTLS_FAILURE");
});
