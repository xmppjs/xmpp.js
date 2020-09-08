"use strict";

const test = require("ava");
const { mockClient } = require("@xmpp/test");

function tick() {
  return new Promise((resolve) => {
    process.nextTick(resolve);
  });
}

test("enable - enabled", async (t) => {
  const { entity } = mockClient();

  entity.mockInput(
    <features xmlns="http://etherx.jabber.org/streams">
      <sm xmlns="urn:xmpp:sm:3" />
    </features>,
  );

  entity.streamManagement.outbound = 45;

  t.deepEqual(
    await entity.catchOutgoing(),
    <enable xmlns="urn:xmpp:sm:3" resume="true" />,
  );

  t.is(entity.streamManagement.outbound, 0);
  t.is(entity.streamManagement.enabled, false);
  t.is(entity.streamManagement.id, "");

  entity.mockInput(
    <enabled
      xmlns="urn:xmpp:sm:3"
      id="some-long-sm-id"
      location="[2001:41D0:1:A49b::1]:9222"
      resume="true"
    />,
  );

  await tick();

  t.is(entity.streamManagement.id, "some-long-sm-id");
  t.is(entity.streamManagement.enabled, true);
});

test("enable - message - enabled", async (t) => {
  const { entity } = mockClient();

  entity.mockInput(
    <features xmlns="http://etherx.jabber.org/streams">
      <sm xmlns="urn:xmpp:sm:3" />
    </features>,
  );

  entity.streamManagement.outbound = 45;

  t.deepEqual(
    await entity.catchOutgoing(),
    <enable xmlns="urn:xmpp:sm:3" resume="true" />,
  );

  t.is(entity.streamManagement.outbound, 0);
  t.is(entity.streamManagement.enabled, false);
  t.is(entity.streamManagement.id, "");

  entity.mockInput(<message />);

  t.is(entity.streamManagement.enabled, false);
  t.is(entity.streamManagement.inbound, 1);

  entity.mockInput(
    <enabled
      xmlns="urn:xmpp:sm:3"
      id="some-long-sm-id"
      location="[2001:41D0:1:A49b::1]:9222"
      resume="true"
    />,
  );

  await tick();

  t.is(entity.streamManagement.id, "some-long-sm-id");
  t.is(entity.streamManagement.enabled, true);
});

test("enable - failed", async (t) => {
  const { entity } = mockClient();

  entity.mockInput(
    <features xmlns="http://etherx.jabber.org/streams">
      <sm xmlns="urn:xmpp:sm:3" />
    </features>,
  );

  entity.streamManagement.outbound = 45;

  t.deepEqual(
    await entity.catchOutgoing(),
    <enable xmlns="urn:xmpp:sm:3" resume="true" />,
  );

  t.is(entity.streamManagement.outbound, 0);
  entity.streamManagement.enabled = true;

  entity.mockInput(<failed xmlns="urn:xmpp:sm:3" />);

  await tick();

  t.is(entity.streamManagement.enabled, false);
});

test("resume - resumed", async (t) => {
  const { entity } = mockClient();

  entity.status = "offline";
  entity.streamManagement.id = "bar";

  entity.mockInput(
    <features xmlns="http://etherx.jabber.org/streams">
      <sm xmlns="urn:xmpp:sm:3" />
    </features>,
  );

  entity.streamManagement.outbound = 45;

  t.deepEqual(
    await entity.catchOutgoing(),
    <resume xmlns="urn:xmpp:sm:3" previd="bar" h="0" />,
  );

  t.is(entity.streamManagement.enabled, false);

  t.is(entity.status, "offline");

  entity.mockInput(<resumed xmlns="urn:xmpp:sm:3" />);

  await tick();

  t.is(entity.streamManagement.outbound, 45);
  t.is(entity.status, "online");
});

test("resume - failed", async (t) => {
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

  t.deepEqual(
    await entity.catchOutgoing(),
    <resume xmlns="urn:xmpp:sm:3" previd="bar" h="0" />,
  );

  entity.mockInput(<failed xmlns="urn:xmpp:sm:3" />);

  await tick();

  t.is(entity.status, "bar");
  t.is(entity.streamManagement.id, "");
  t.is(entity.streamManagement.enabled, false);
  t.is(entity.streamManagement.outbound, 0);
});
