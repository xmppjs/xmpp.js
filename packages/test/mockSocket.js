import { EventEmitter } from "@xmpp/events";

class MockSocket extends EventEmitter {
  write(data, cb) {
    cb();
  }
}

export default function mockSocket() {
  return new MockSocket();
}
