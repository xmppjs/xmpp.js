"use strict";

const tls = require("tls");
const EventEmitter = require("events");

class Socket extends EventEmitter {
  constructor() {
    super();
    this.listeners = Object.create(null);
    this.timeout = null;
  }

  connect(...args) {
    this._attachSocket(tls.connect(...args));
  }

  _attachSocket(socket) {
    this.socket = socket;
    const { listeners } = this;

    listeners.close = () => {
      this._detachSocket();
      this.emit("close");
    };
    listeners.data = (data) => {
      this.emit("data", data);
    };
    listeners.error = (err) => {
      this.emit("error", err);
    };
    listeners.secureConnect = () => {
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
    };

    for (const [event, listener] of Object.entries(listeners)) {
      socket.on(event, listener);
    }
  }

  _detachSocket() {
    clearTimeout(this.timeout);
    const { socket, listeners } = this;
    for (const [event, listener] of Object.entries(listeners)) {
      socket.removeListener(event, listener);
      delete listeners[event];
    }
    delete this.socket;
  }

  end() {
    this.socket.end();
  }

  write(data, fn) {
    this.socket.write(data, fn);
  }
}

module.exports = Socket;
