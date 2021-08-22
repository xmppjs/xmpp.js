"use strict";

const tls = require("tls");
const EventEmitter = require("events");

class Socket extends EventEmitter {
  constructor() {
    super();
    this.listeners = Object.create(null);
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
      this.emit("connect");
    };

    for (const [event, listener] of Object.entries(listeners)) {
      socket.on(event, listener);
    }
  }

  _detachSocket() {
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
