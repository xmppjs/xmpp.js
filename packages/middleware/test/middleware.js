import { context, mockClient, mockInput, promiseError } from "@xmpp/test";

import IncomingContext from "../lib/IncomingContext.js";
import OutgoingContext from "../lib/OutgoingContext.js";
import _middleware from "../index.js";

let ctx;

beforeEach(() => {
  ctx = context();
  const { entity } = ctx;
  ctx.middleware = _middleware({ entity });
});

test("use", (done) => {
  expect.assertions(4);
  const stanza = <presence />;
  ctx.middleware.use((ctx, next) => {
    expect(ctx instanceof IncomingContext).toBe(true);
    expect(ctx.stanza).toEqual(stanza);
    expect(ctx.entity).toBe(ctx.entity);
    expect(next() instanceof Promise).toBe(true);
    done();
  });
  ctx.fakeIncoming(stanza);
});

test("filter", (done) => {
  expect.assertions(3);
  const stanza = <presence />;
  ctx.middleware.filter((ctx, next) => {
    expect(ctx instanceof OutgoingContext).toBe(true);
    expect(ctx.stanza).toEqual(stanza);
    expect(next() instanceof Promise).toBe(true);
    done();
  });
  ctx.fakeOutgoing(stanza);
});

test("emits an error event if a middleware throws", async () => {
  const xmpp = mockClient();
  const { middleware } = xmpp;

  const error = new Error("foobar");
  const willError = promiseError(xmpp);

  middleware.use(async () => {
    await Promise.resolve();
    throw error;
  });

  mockInput(xmpp, <presence id="hello" />);

  const err = await willError;
  expect(err).toEqual(error);
});
