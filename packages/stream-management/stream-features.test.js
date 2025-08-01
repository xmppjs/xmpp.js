import { mockClient } from "@xmpp/test";
import { tick } from "@xmpp/events";

test("enable - enabled", async () => {
  const { entity } = mockClient();

  entity.mockInput(
    <features xmlns="http://etherx.jabber.org/streams">
      <sm xmlns="urn:xmpp:sm:3" />
    </features>,
  );

  entity.streamManagement.outbound = 45;

  expect(await entity.catchOutgoing()).toEqual(
    <enable xmlns="urn:xmpp:sm:3" resume="true" />,
  );

  expect(entity.streamManagement.outbound).toBe(0);
  expect(entity.streamManagement.outbound_q).toBeEmpty();
  expect(entity.streamManagement.enabled).toBe(false);
  expect(entity.streamManagement.id).toBe("");

  entity.mockInput(
    <enabled
      xmlns="urn:xmpp:sm:3"
      id="some-long-sm-id"
      location="[2001:41D0:1:A49b::1]:9222"
      resume="true"
    />,
  );

  await tick();

  expect(entity.streamManagement.id).toBe("some-long-sm-id");
  expect(entity.streamManagement.enabled).toBe(true);
});

test("enable - send rejects", async () => {
  const { entity } = mockClient();

  entity.send = () => Promise.reject(new Error("nope"));

  entity.mockInput(
    <enabled
      xmlns="urn:xmpp:sm:3"
      id="some-long-sm-id"
      location="[2001:41D0:1:A49b::1]:9222"
      resume="true"
    />,
  );

  expect(entity.streamManagement.enabled).toBe(false);
});

test("enable - message - enabled", async () => {
  const { entity } = mockClient();

  entity.mockInput(
    <features xmlns="http://etherx.jabber.org/streams">
      <sm xmlns="urn:xmpp:sm:3" />
    </features>,
  );

  entity.streamManagement.outbound = 45;

  expect(await entity.catchOutgoing()).toEqual(
    <enable xmlns="urn:xmpp:sm:3" resume="true" />,
  );

  expect(entity.streamManagement.outbound).toBe(0);
  expect(entity.streamManagement.outbound_q).toBeEmpty();
  expect(entity.streamManagement.enabled).toBe(false);
  expect(entity.streamManagement.id).toBe("");

  entity.mockInput(<message />);

  expect(entity.streamManagement.enabled).toBe(false);
  expect(entity.streamManagement.inbound).toBe(1);

  entity.mockInput(
    <enabled
      xmlns="urn:xmpp:sm:3"
      id="some-long-sm-id"
      location="[2001:41D0:1:A49b::1]:9222"
      resume="true"
    />,
  );

  await tick();

  expect(entity.streamManagement.id).toBe("some-long-sm-id");
  expect(entity.streamManagement.enabled).toBe(true);
});

test("enable - failed", async () => {
  const { entity } = mockClient();

  entity.mockInput(
    <features xmlns="http://etherx.jabber.org/streams">
      <sm xmlns="urn:xmpp:sm:3" />
    </features>,
  );

  entity.streamManagement.outbound = 45;

  expect(await entity.catchOutgoing()).toEqual(
    <enable xmlns="urn:xmpp:sm:3" resume="true" />,
  );

  expect(entity.streamManagement.outbound).toBe(0);
  expect(entity.streamManagement.outbound_q).toBeEmpty();
  entity.streamManagement.enabled = true;

  entity.mockInput(
    <failed xmlns="urn:xmpp:sm:3">
      <unexpected-request xmlns="urn:ietf:params:xml:ns:xmpp-stanzas" />
    </failed>,
  );

  await tick();

  expect(entity.streamManagement.enabled).toBe(false);
});

test("resume - resumed", async () => {
  const { entity } = mockClient();

  entity.status = "offline";
  entity.streamManagement.id = "bar";

  entity.mockInput(
    <features xmlns="http://etherx.jabber.org/streams">
      <sm xmlns="urn:xmpp:sm:3" />
    </features>,
  );

  entity.streamManagement.outbound = 45;
  entity.streamManagement.outbound_q = [
    { stanza: <message id="a" />, stamp: "1990-01-01T00:00:00Z" },
    { stanza: <message id="b" />, stamp: "1990-01-01T00:00:00Z" },
  ];

  expect(await entity.catchOutgoing()).toEqual(
    <resume xmlns="urn:xmpp:sm:3" previd="bar" h="0" />,
  );

  expect(entity.streamManagement.enabled).toBe(false);

  expect(entity.status).toBe("offline");

  entity.mockInput(<resumed xmlns="urn:xmpp:sm:3" h="46" />);

  let acks = 0;
  entity.streamManagement.on("ack", (stanza) => {
    expect(stanza.attrs.id).toBe("a");
    acks++;
  });

  expect(await entity.catchOutgoing()).toEqual(
    <message id="b">
      <delay
        xmlns="urn:xmpp:delay"
        from="foo@bar/test"
        stamp="1990-01-01T00:00:00Z"
      />
    </message>,
  );

  await tick();

  expect(acks).toBe(1);
  expect(entity.streamManagement.outbound).toBe(46);
  expect(entity.streamManagement.outbound_q).toHaveLength(1);
  expect(entity.status).toBe("online");
});

test("resumed event", async () => {
  const { entity } = mockClient();

  entity.status = "offline";
  entity.streamManagement.id = "bar";

  entity.mockInput(
    <features xmlns="http://etherx.jabber.org/streams">
      <sm xmlns="urn:xmpp:sm:3" />
    </features>,
  );

  entity.streamManagement.outbound = 45;
  entity.streamManagement.outbound_q = [
    { stanza: <message id="a" />, stamp: "1990-01-01T00:00:00Z" },
    { stanza: <message id="b" />, stamp: "1990-01-01T00:00:00Z" },
  ];

  expect(await entity.catchOutgoing()).toEqual(
    <resume xmlns="urn:xmpp:sm:3" previd="bar" h="0" />,
  );

  expect(entity.streamManagement.enabled).toBe(false);

  expect(entity.status).toBe("offline");

  entity.mockInput(<resumed xmlns="urn:xmpp:sm:3" h="46" />);

  let acks = 0;
  entity.streamManagement.on("ack", (stanza) => {
    expect(stanza.attrs.id).toBe("a");
    acks++;
  });

  expect(await entity.catchOutgoing()).toEqual(
    <message id="b">
      <delay
        xmlns="urn:xmpp:delay"
        from="foo@bar/test"
        stamp="1990-01-01T00:00:00Z"
      />
    </message>,
  );

  let resumed = false;
  entity.streamManagement.on("resumed", () => {
    resumed = true;
  });

  await tick();

  expect(resumed).toBe(true);
  expect(acks).toBe(1);
  expect(entity.streamManagement.outbound).toBe(46);
  expect(entity.streamManagement.outbound_q).toHaveLength(1);
  expect(entity.status).toBe("online");
});

test("resume - failed", async () => {
  const { entity } = mockClient();

  entity.status = "bar";
  entity.streamManagement.id = "bar";
  entity.streamManagement.enabled = true;
  entity.streamManagement.outbound = 45;
  entity.streamManagement.outbound_q = [];

  entity.mockInput(
    <features xmlns="http://etherx.jabber.org/streams">
      <sm xmlns="urn:xmpp:sm:3" />
    </features>,
  );

  expect(await entity.catchOutgoing()).toEqual(
    <resume xmlns="urn:xmpp:sm:3" previd="bar" h="0" />,
  );

  entity.mockInput(
    <failed xmlns="urn:xmpp:sm:3">
      <unexpected-request xmlns="urn:ietf:params:xml:ns:xmpp-stanzas" />
    </failed>,
  );

  await tick();

  expect(entity.status).toBe("bar");
  expect(entity.streamManagement.id).toBe("");
  expect(entity.streamManagement.enabled).toBe(false);
  expect(entity.streamManagement.outbound).toBe(0);
  expect(entity.streamManagement.outbound_q).toBeEmpty();
});

test("resume - failed with something in queue", async () => {
  const { entity } = mockClient();

  entity.status = "bar";
  entity.streamManagement.id = "bar";
  entity.streamManagement.enabled = true;
  entity.streamManagement.outbound = 45;
  entity.streamManagement.outbound_q = [{ stanza: "hai" }];

  entity.mockInput(
    <features xmlns="http://etherx.jabber.org/streams">
      <sm xmlns="urn:xmpp:sm:3" />
    </features>,
  );

  expect(await entity.catchOutgoing()).toEqual(
    <resume xmlns="urn:xmpp:sm:3" previd="bar" h="0" />,
  );

  entity.mockInput(
    <failed xmlns="urn:xmpp:sm:3">
      <unexpected-request xmlns="urn:ietf:params:xml:ns:xmpp-stanzas" />
    </failed>,
  );

  let failures = 0;
  entity.streamManagement.on("fail", (failed) => {
    failures++;
    expect(failed).toBe("hai");
  });

  await tick();

  expect(failures).toBe(1);
  expect(entity.status).toBe("bar");
  expect(entity.streamManagement.id).toBe("");
  expect(entity.streamManagement.enabled).toBe(false);
  expect(entity.streamManagement.outbound).toBe(0);
  expect(entity.streamManagement.outbound_q).toBeEmpty();
});

test("sends an <r/> after stanzas, debounced", async () => {
  const { entity } = mockClient();

  entity.streamManagement.enabled = true;

  let r = 0;
  const onSend = (stanza) => {
    if (stanza.name === "r") r++;
  };
  entity.on("send", onSend);

  jest.useFakeTimers();

  let promise = entity.send(<message id="a" />);
  jest.advanceTimersByTime(50);
  await promise;
  expect(r).toBe(0);

  promise = entity.send(<message id="b" />);
  jest.advanceTimersByTime(50);
  await promise;
  expect(r).toBe(0);

  jest.advanceTimersByTime(1000);
  jest.useRealTimers();
  await tick();

  expect(r).toBe(1);

  entity.removeListener("send", onSend);
  await entity.disconnect();
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

test("enable - outbound stanza - enabled", async () => {
  const { entity } = mockClient();

  entity.mockInput(
    <features xmlns="http://etherx.jabber.org/streams">
      <sm xmlns="urn:xmpp:sm:3" />
    </features>,
  );

  expect(await entity.catchOutgoing()).toEqual(
    <enable xmlns="urn:xmpp:sm:3" resume="true" />,
  );

  expect(entity.streamManagement.outbound).toBe(0);
  expect(entity.streamManagement.outbound_q).toBeEmpty();
  expect(entity.streamManagement.enabled).toBe(false);

  await entity.send(<message />);

  expect(entity.streamManagement.enabled).toBe(false);
  expect(entity.streamManagement.outbound_q).toHaveLength(1);

  entity.mockInput(
    <enabled
      xmlns="urn:xmpp:sm:3"
      id="some-long-sm-id"
      location="[2001:41D0:1:A49b::1]:9222"
      resume="true"
    />,
  );

  await tick();

  expect(entity.streamManagement.outbound_q).toHaveLength(1);
  expect(entity.streamManagement.enabled).toBe(true);
});
