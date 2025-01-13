import { client } from "../packages/client/index.js";
import { promise } from "../packages/events/index.js";
import { datetime } from "../packages/time/index.js";
import debug from "../packages/debug/index.js";
import server from "../server/index.js";

const username = "client";
const password = "foobar";
const credentials = { username, password };
const domain = "localhost";

let xmpp;

afterEach(async () => {
  await xmpp?.stop();
  await server.reset();
});

test("client ack stanzas", async () => {
  await server.enableModules(["smacks"]);
  await server.restart();

  xmpp = client({ credentials, service: domain });
  debug(xmpp);

  const elP = promise(xmpp.streamManagement, "ack");
  await xmpp.start();
  await xmpp.send(
    <iq to={domain} id="ping">
      <ping xmlns="urn:xmppp:ping" />
    </iq>,
  );

  const el = await elP;
  expect(el.attrs.id).toEqual("ping");
});

test("client fail stanzas", async () => {
  await server.enableModules(["smacks"]);
  await server.restart();

  xmpp = client({ credentials, service: domain });
  debug(xmpp);

  const elP = promise(xmpp.streamManagement, "fail");
  await xmpp.start();
  // Expect send but don't actually send to server, so it will fail
  await xmpp.streamManagement.outbound_q.push({
    stanza: <iq to={domain} id="ping">
      <ping xmlns="urn:xmppp:ping" />
    </iq>,
    stamp: datetime()
  });
  await xmpp.stop();

  const el = await elP;
  expect(el.attrs.id).toEqual("ping");
});

test("client retry stanzas", async () => {
  await server.enableModules(["smacks"]);
  await server.restart();

  xmpp = client({ credentials, service: domain });
  debug(xmpp);

  const elP = promise(xmpp.streamManagement, "ack");
  await xmpp.start();
  // Add to queue but don't actually send so it can retry after disconnect
  await xmpp.streamManagement.outbound_q.push({
    stanza: <iq to={domain} id="ping">
      <ping xmlns="urn:xmppp:ping" />
    </iq>,
    stamp: datetime()
  });
  await xmpp.disconnect();

  const el = await elP;
  expect(el.attrs.id).toEqual("ping");
});

test("client reconnect automatically", async () => {
  await server.enableModules(["smacks"]);
  await server.restart();

  xmpp = client({ credentials, service: domain });
  xmpp.streamManagement.timeout = 10;
  xmpp.streamManagement.debounceAckRequest = 1;
  debug(xmpp);

  const resumedP = promise(xmpp.streamManagement, "resumed");
  await xmpp.start();
  await xmpp.send(
    <iq to={domain} id="ping">
      <ping xmlns="urn:xmppp:ping" />
    </iq>,
  );
  xmpp.socket.socket.pause();

  await resumedP;
  expect().pass();
});
