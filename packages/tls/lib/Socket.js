import tls from "node:tls";

import { EventEmitter, listeners } from "@xmpp/events";

class Socket extends EventEmitter {
  timeout = null;
  #listeners = null;
  socket = null;
  secure = true;

  connect(...args) {
    this._attachSocket(tls.connect(...args));
  }

  _attachSocket(socket) {
    this.socket = socket;
    this.#listeners ??= listeners({
      close: () => {
        this._detachSocket();
        this.emit("close");
      },
      data: (data) => {
        this.emit("data", data);
      },
      error: (err) => {
        this.emit("error", err);
      },
      secureConnect: () => {
        if (this.socket.getProtocol() !== "TLSv1.3") {
          return this.emit("connect");
        }

        // Waiting before sending the stream header improves compatibility
        // with Openfire TLSv1.3 implementation. For more info, see:
        // https://github.com/xmppjs/xmpp.js/issues/889#issuecomment-902686879
        // https://github.com/xmppjs/xmpp.js/pull/912
        this.timeout = setTimeout(() => {
          this.emit("connect");
        }, 1);
      },
    });
    this.#listeners.subscribe(this.socket);
  }

  _detachSocket() {
    this.#listeners.unsubscribe(this.socket);
    this.socket = null;
  }

  end() {
    this.socket.end();
  }

  write(data, fn) {
    this.socket.write(data, fn);
  }
}

export default Socket;
