// Smoke tests to verify xmpp.js core packages work with Deno runtime
import { jid } from "../packages/jid/index.js";
import id from "../packages/id/index.js";

function assertEquals(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(message || `Expected ${expected}, got ${actual}`);
  }
}

function assertNotEquals(actual, expected, message) {
  if (actual === expected) {
    throw new Error(message || `Expected values to be different, but both were ${actual}`);
  }
}

Deno.test("JID - basic address handling", () => {
  const addr = jid("foo@bar/baz");
  assertEquals(addr.toString(), "foo@bar/baz");
  assertEquals(addr.local, "foo");
  assertEquals(addr.domain, "bar");
  assertEquals(addr.resource, "baz");
});

Deno.test("JID - parsing", () => {
  const parsed = jid("user@example.com");
  assertEquals(parsed.local, "user");
  assertEquals(parsed.domain, "example.com");
});

Deno.test("JID - equality", () => {
  const addr1 = jid("user@example.com/resource");
  const addr2 = jid("user@example.com/resource");
  assertEquals(addr1.equals(addr2), true);
});

Deno.test("JID - bare address", () => {
  const withResource = jid("user@example.com/mobile");
  const bare = withResource.bare();
  assertEquals(bare.toString(), "user@example.com");
});

Deno.test("ID - unique generation", () => {
  const id1 = id();
  const id2 = id();
  assertEquals(typeof id1, "string");
  assertEquals(id1.length > 0, true);
  assertNotEquals(id1, id2);
});
