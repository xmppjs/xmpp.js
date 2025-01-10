import net from "node:net";

class MockSocket extends net.Socket {
  secure = true;

  write(data, cb) {
    process.nextTick(() => {
      cb?.();
    });
  }
}

export default function mockSocket() {
  return new MockSocket();
}
