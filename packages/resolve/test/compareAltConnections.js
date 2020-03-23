"use strict";

const test = require("ava");
const { compare } = require("../lib/alt-connections");

test("by security", (t) => {
  t.deepEqual(
    [
      { uri: "http://web.example.org:5280/bosh", method: "xbosh" },
      { uri: "https://web.example.org:5280/bosh", method: "xbosh" },
    ].sort(compare),
    [
      { uri: "https://web.example.org:5280/bosh", method: "xbosh" },
      { uri: "http://web.example.org:5280/bosh", method: "xbosh" },
    ],
  );

  t.deepEqual(
    [
      { uri: "ws://web.example.com:80/ws", method: "websocket" },
      { uri: "https://web.example.org:5280/bosh", method: "xbosh" },
    ].sort(compare),
    [
      { uri: "https://web.example.org:5280/bosh", method: "xbosh" },
      { uri: "ws://web.example.com:80/ws", method: "websocket" },
    ],
  );
});

test("by method", (t) => {
  t.deepEqual(
    [
      { uri: "https://web.example.org:5280/http-poll", method: "httppoll" },
      { uri: "wss://web.example.com:443/ws", method: "websocket" },
      { uri: "https://web.example.org:5280/bosh", method: "xbosh" },
    ].sort(compare),
    [
      { uri: "wss://web.example.com:443/ws", method: "websocket" },
      { uri: "https://web.example.org:5280/bosh", method: "xbosh" },
      { uri: "https://web.example.org:5280/http-poll", method: "httppoll" },
    ],
  );
});
