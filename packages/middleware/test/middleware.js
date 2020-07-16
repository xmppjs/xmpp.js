"use strict";

const test = require("ava");
const IncomingContext = require("../lib/IncomingContext");
const OutgoingContext = require("../lib/OutgoingContext");
const { context, mockClient, mockInput, promiseError } = require("@xmpp/test");
const middleware = require("..");

test.beforeEach((t) => {
  t.context = context();
  const { entity } = t.context;
  t.context.middleware = middleware({ entity });
});

test.cb("use", (t) => {
  t.plan(4);
  const stanza = <presence />;
  t.context.middleware.use((ctx, next) => {
    t.true(ctx instanceof IncomingContext);
    t.deepEqual(ctx.stanza, stanza);
    t.is(ctx.entity, t.context.entity);
    t.true(next() instanceof Promise);
    t.end();
  });
  t.context.fakeIncoming(stanza);
});

test.cb("use with name condition", (t) => {
  t.plan(4);
  const stanza = <presence />;
  t.context.middleware.use("presence", (ctx, next) => {
    t.true(ctx instanceof IncomingContext);
    t.deepEqual(ctx.stanza, stanza);
    t.is(ctx.entity, t.context.entity);
    t.true(next() instanceof Promise);
    t.end();
  });
  t.context.fakeIncoming(stanza);
});

test.cb("use with name and type condition", (t) => {
  t.plan(4);
  const stanza = <message type="chat" />;
  t.context.middleware.use("message", "*", "*", "chat", (ctx, next) => {
    t.true(ctx instanceof IncomingContext);
    t.deepEqual(ctx.stanza, stanza);
    t.is(ctx.entity, t.context.entity);
    t.true(next() instanceof Promise);
    t.end();
  });
  t.context.fakeIncoming(stanza);
});

test.cb("use with name, child name and type condition", (t) => {
  t.plan(4);
  const stanza = (
    <message type="chat">
      <x />
    </message>
  );
  t.context.middleware.use("message", "x", "*", "chat", (ctx, next) => {
    t.true(ctx instanceof IncomingContext);
    t.deepEqual(ctx.stanza, stanza);
    t.is(ctx.entity, t.context.entity);
    t.true(next() instanceof Promise);
    t.end();
  });
  t.context.fakeIncoming(stanza);
});

test.cb("use with name, child name with xmlns and type condition", (t) => {
  t.plan(4);
  const stanza = (
    <message type="chat">
      <x xmlns="http://jabber.org/protocol/muc#user">
        <invite />
      </x>
    </message>
  );
  t.context.middleware.use(
    "message",
    "x",
    "http://jabber.org/protocol/muc#user",
    "chat",
    (ctx, next) => {
      t.true(ctx instanceof IncomingContext);
      t.deepEqual(ctx.stanza, stanza);
      t.is(ctx.entity, t.context.entity);
      t.true(next() instanceof Promise);
      t.end();
    },
  );
  t.context.fakeIncoming(stanza);
});

test.cb("use with name, child name with xmlns without type condition", (t) => {
  t.plan(4);
  const stanza = (
    <message type="chat">
      <x xmlns="http://jabber.org/protocol/muc#user">
        <invite />
      </x>
    </message>
  );
  t.context.middleware.use(
    "message",
    "x",
    "http://jabber.org/protocol/muc#user",
    (ctx, next) => {
      t.true(ctx instanceof IncomingContext);
      t.deepEqual(ctx.stanza, stanza);
      t.is(ctx.entity, t.context.entity);
      t.true(next() instanceof Promise);
      t.end();
    },
  );
  t.context.fakeIncoming(stanza);
});

test.cb("use with name, child name without xmlns and type condition", (t) => {
  t.plan(4);
  const stanza = (
    <message type="chat">
      <x xmlns="http://jabber.org/protocol/muc#user">
        <invite />
      </x>
    </message>
  );
  t.context.middleware.use("message", "x", (ctx, next) => {
    t.true(ctx instanceof IncomingContext);
    t.deepEqual(ctx.stanza, stanza);
    t.is(ctx.entity, t.context.entity);
    t.true(next() instanceof Promise);
    t.end();
  });
  t.context.fakeIncoming(stanza);
});

test.cb("filter", (t) => {
  t.plan(4);
  const stanza = <presence />;
  /* eslint-disable array-callback-return */
  t.context.middleware.filter((ctx, next) => {
    t.true(ctx instanceof OutgoingContext);
    t.deepEqual(ctx.stanza, stanza);
    t.is(ctx.entity, t.context.entity);
    t.true(next() instanceof Promise);
    t.end();
  });
  /* eslint-enable array-callback-return */
  t.context.fakeOutgoing(stanza);
});

test.cb("filter with name, child name with xmlns and type condition", (t) => {
  t.plan(4);
  const stanza = (
    <message type="chat">
      <x xmlns="http://jabber.org/protocol/muc#user">
        <invite />
      </x>
    </message>
  );
  t.context.middleware.filter(
    "message",
    "x",
    "http://jabber.org/protocol/muc#user",
    "chat",
    (ctx, next) => {
      t.true(ctx instanceof OutgoingContext);
      t.deepEqual(ctx.stanza, stanza);
      t.is(ctx.entity, t.context.entity);
      t.true(next() instanceof Promise);
      t.end();
    },
  );
  t.context.fakeOutgoing(stanza);
});

test("emits an error event if a middleware throws", async (t) => {
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
  t.deepEqual(err, error);
});
