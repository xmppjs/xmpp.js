import { EventEmitter, listeners } from "@xmpp/events";
import { parseURI } from "@xmpp/connection/lib/util.js";

const CODE = "ECONNERROR";

export function isSecure(url) {
  const uri = parseURI(url);
  if (uri.protocol === "wss:") return true;
  if (["localhost", "127.0.0.1", "::1"].includes(uri.hostname)) return true;
  return false;
}

export default class Socket extends EventEmitter {
  #listeners = null;
  socket = null;
  url = null;
  secure = false;

  connect(url) {
    this.url = url;
    this.secure = isSecure(url);
    // eslint-disable-next-line n/no-unsupported-features/node-builtins
    this._attachSocket(new WebSocket(url, ["xmpp"]));
  }

  _attachSocket(socket) {
    this.socket = socket;
    this.#listeners ??= listeners({
      open: () => this.emit("connect"),
      message: ({ data }) => this.emit("data", data),
      error: (event) => {
        const { url } = this;
        // WS
        let { error } = event;
        // DOM
        if (!error) {
          error = new Error(event.message || `WebSocket ${CODE} ${url}`);
          error.errno = CODE;
          error.code = CODE;
        }

        error.event = event;
        error.url = url;
        this.emit("error", error);
      },
      close: (event) => {
        this._detachSocket();
        this.emit("close", !event.wasClean, event);
      },
    });
    this.#listeners.subscribe(this.socket);
  }

  _detachSocket() {
    this.url = null;
    this.secure = false;
    this.socket && this.#listeners?.unsubscribe(this.socket);
    this.socket = null;
  }

  end() {
    this.socket.close();
  }

  write(data, fn) {
    function done(err) {
      if (!fn) return;
      // eslint-disable-next-line promise/catch-or-return, promise/no-promise-in-callback
      Promise.resolve().then(() => fn(err));
    }

    try {
      this.socket.send(data);
    } catch (err) {
      done(err);
      return;
    }
    done();
  }
}
