import { compare } from "../lib/alt-connections.js";

test("by security", () => {
  expect(
    [
      { uri: "http://web.example.org:5280/bosh", method: "xbosh" },
      { uri: "https://web.example.org:5280/bosh", method: "xbosh" },
    ].toSorted(compare),
  ).toEqual([
    { uri: "https://web.example.org:5280/bosh", method: "xbosh" },
    { uri: "http://web.example.org:5280/bosh", method: "xbosh" },
  ]);

  expect(
    [
      { uri: "ws://web.example.com:80/ws", method: "websocket" },
      { uri: "https://web.example.org:5280/bosh", method: "xbosh" },
    ].toSorted(compare),
  ).toEqual([
    { uri: "https://web.example.org:5280/bosh", method: "xbosh" },
    { uri: "ws://web.example.com:80/ws", method: "websocket" },
  ]);
});

test("by method", () => {
  expect(
    [
      { uri: "https://web.example.org:5280/http-poll", method: "httppoll" },
      { uri: "wss://web.example.com:443/ws", method: "websocket" },
      { uri: "https://web.example.org:5280/bosh", method: "xbosh" },
    ].toSorted(compare),
  ).toEqual([
    { uri: "wss://web.example.com:443/ws", method: "websocket" },
    { uri: "https://web.example.org:5280/bosh", method: "xbosh" },
    { uri: "https://web.example.org:5280/http-poll", method: "httppoll" },
  ]);
});
