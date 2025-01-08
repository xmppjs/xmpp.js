import { client } from "../packages/client/index.js";
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
  expect.assertions(1);

  await server.enableModules(["smacks"]);
  await server.restart();

  xmpp = client({ credentials, service: domain });
  debug(xmpp);

  xmpp.streamManagement.on("ack", (el) => {
    expect(el.attrs.id).toEqual("ping");
    xmpp.streamManagement._teardown();
  });

  await xmpp.start();
  await xmpp.send(
    <iq to={domain} id="ping">
      <ping xmlns="urn:xmppp:ping" />
    </iq>,
  );
});
