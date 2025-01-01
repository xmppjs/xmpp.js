import { mockClient } from "@xmpp/test";

function tick() {
  return new Promise((resolve) => {
    process.nextTick(resolve);
  });
}

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
  entity.streamManagement.enabled = true;

  entity.mockInput(<failed xmlns="urn:xmpp:sm:3" />);

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

  expect(await entity.catchOutgoing()).toEqual(
    <resume xmlns="urn:xmpp:sm:3" previd="bar" h="0" />,
  );

  expect(entity.streamManagement.enabled).toBe(false);

  expect(entity.status).toBe("offline");

  entity.mockInput(<resumed xmlns="urn:xmpp:sm:3" />);

  await tick();

  expect(entity.streamManagement.outbound).toBe(45);
  expect(entity.status).toBe("online");
});

test("resume - failed", async () => {
  const { entity } = mockClient();

  entity.status = "bar";
  entity.streamManagement.id = "bar";
  entity.streamManagement.enabled = true;
  entity.streamManagement.outbound = 45;

  entity.mockInput(
    <features xmlns="http://etherx.jabber.org/streams">
      <sm xmlns="urn:xmpp:sm:3" />
    </features>,
  );

  expect(await entity.catchOutgoing()).toEqual(
    <resume xmlns="urn:xmpp:sm:3" previd="bar" h="0" />,
  );

  entity.mockInput(<failed xmlns="urn:xmpp:sm:3" />);

  await tick();

  expect(entity.status).toBe("bar");
  expect(entity.streamManagement.id).toBe("");
  expect(entity.streamManagement.enabled).toBe(false);
  expect(entity.streamManagement.outbound).toBe(0);
});
