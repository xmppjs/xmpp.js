import Context from "../lib/Context.js";

test("sets the entity property", () => {
  const entity = {};
  const ctx = new Context(entity, { attrs: {} });
  expect(ctx.entity).toBe(entity);
});

test("sets the stanza property", () => {
  const stanza = <presence />;
  const ctx = new Context({}, stanza);
  expect(ctx.stanza).toBe(stanza);
});

test("sets name, id and type properties", () => {
  const stanza = <message id="foobar" type="whatever" />;
  const ctx = new Context({}, stanza);
  expect(ctx.name).toBe("message");
  expect(ctx.id).toBe("foobar");
  expect(ctx.type).toBe("whatever");
});

test("id property defaults to empty string", () => {
  const stanza = <message />;
  const ctx = new Context({}, stanza);
  expect(ctx.id).toBe("");
});

test("type property defaults to normal for message", () => {
  const stanza = <message />;
  const ctx = new Context({}, stanza);
  expect(ctx.type).toBe("normal");
});

test("type property defaults to available for presence", () => {
  const stanza = <presence />;
  const ctx = new Context({}, stanza);
  expect(ctx.type).toBe("available");
});

test("type property defaults to empty string for iq", () => {
  const stanza = <iq />;
  const ctx = new Context({}, stanza);
  expect(ctx.type).toBe("");
});

test("type property defaults to empty string for nonzas", () => {
  const stanza = <foobar />;
  const ctx = new Context({}, stanza);
  expect(ctx.type).toBe("");
});

test("to property is null", () => {
  const ctx = new Context({}, <foobar />);
  expect(ctx.to).toBe(null);
});

test("from property is null", () => {
  const ctx = new Context({}, <foobar />);
  expect(ctx.from).toBe(null);
});

test("local property is an empty string", () => {
  const ctx = new Context({}, <foobar />);
  expect(ctx.local).toBe("");
});

test("domain property is an empty string", () => {
  const ctx = new Context({}, <foobar />);
  expect(ctx.domain).toBe("");
});

test("resource property is an empty string", () => {
  const ctx = new Context({}, <foobar />);
  expect(ctx.resource).toBe("");
});
