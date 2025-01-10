import net from "node:net";

class MockSocket extends net.Socket {
  write(data, cb) {
    process.nextTick(() => {
      cb?.();
    });
  }
  isSecure() {
    return true;
  }
}

export default function mockSocket() {
  return new MockSocket();
}
