import { component, xml, jid } from "../packages/component/index.js";
import debug from "../packages/debug/index.js";
import server from "../server/index.js";

const password = "mysecretcomponentpassword";
const service = "xmpp://localhost:5347";
const domain = "component.localhost";
const options = { password, service, domain };

let xmpp;

beforeEach(async () => {
  xmpp = component(options);
  debug(xmpp);
  await server.restart();
});

afterEach(async () => {
  await xmpp?.stop();
});

test("component", async () => {
  expect.assertions(6);

  xmpp.on("connect", () => {
    expect().pass();
  });

  xmpp.on("open", (el) => {
    expect(el instanceof xml.Element).toBe(true);
  });

  xmpp.on("online", (id) => {
    expect(id instanceof jid.JID).toBe(true);
    expect(id.toString()).toBe("component.localhost");
  });

  const id = await xmpp.start();

  expect(id instanceof jid.JID).toBe(true);
  expect(id.toString()).toBe("component.localhost");
  await xmpp.stop;
});

test("reconnects when server restarts", (done) => {
  expect.assertions(2);
  let c = 0;

  xmpp.on("error", () => {});

  xmpp.on("online", async () => {
    c++;
    expect().pass();
    if (c === 2) {
      await xmpp.stop();
      done();
    } else {
      server.restart();
    }
  });

  xmpp.start();
});

test("does not reconnect when stop is called", (done) => {
  expect.assertions(2);

  xmpp.on("online", async () => {
    await xmpp.stop();
    await server.stop();
    done();
  });

  xmpp.on("close", () => {
    expect().pass();
  });

  xmpp.on("offline", () => {
    expect().pass();
  });

  xmpp.start();
});
