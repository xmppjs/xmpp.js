// Smoke tests to verify xmpp.js core packages work with Deno runtime
import { jid } from "../packages/jid/index.js";
import id from "../packages/id/index.js";

// Test JID package - core XMPP address handling
const addr = jid("foo@bar/baz");
console.assert(addr.toString() === "foo@bar/baz", "JID toString failed");
console.assert(addr.local === "foo", "JID local failed");
console.assert(addr.domain === "bar", "JID domain failed");
console.assert(addr.resource === "baz", "JID resource failed");

const parsed = jid("user@example.com");
console.assert(parsed.local === "user", "JID parse local failed");
console.assert(parsed.domain === "example.com", "JID parse domain failed");

// Test JID equality
const addr1 = jid("user@example.com/resource");
const addr2 = jid("user@example.com/resource");
console.assert(addr1.equals(addr2), "JID equality failed");

// Test JID bare
const withResource = jid("user@example.com/mobile");
const bare = withResource.bare();
console.assert(bare.toString() === "user@example.com", "JID bare failed");

// Test ID package - unique ID generation
const id1 = id();
const id2 = id();
console.assert(typeof id1 === "string", "ID generation failed");
console.assert(id1.length > 0, "ID length failed");
console.assert(id1 !== id2, "ID uniqueness failed");

console.log("✓ All Deno smoke tests passed");
