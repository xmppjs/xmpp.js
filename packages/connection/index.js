import { EventEmitter, promise, listeners } from "@xmpp/events";
import jid from "@xmpp/jid";
import xml from "@xmpp/xml";

import StreamError from "./lib/StreamError.js";
import { parseHost, parseService } from "./lib/util.js";

const NS_STREAM = "urn:ietf:params:xml:ns:xmpp-streams";
const NS_JABBER_STREAM = "http://etherx.jabber.org/streams";

class Connection extends EventEmitter {
  #socketListeners = null;
  #parserListeners = null;

  constructor(options = {}) {
    super();

    if (typeof options === "string") {
      options = { domain: options };
    }

    this.jid = null;
    this.timeout = options.timeout || 2000;
    this.options = options;
    this.status = "offline";
    this.socket = null;
    this.parser = null;
    this.root = null;
  }

  isSecure() {
    return this.socket?.secure === true;
  }

  async _streamError(condition, children) {
    try {
      await this.send(
        // prettier-ignore
        xml('stream:error', {}, [
          xml(condition, {xmlns: NS_STREAM}, children),
        ]),
      );
    } catch {}

    return this.disconnect();
  }

  _onData(data) {
    const str = data.toString("utf8");
    this.parser.write(str);
  }

  #onParserError(error) {
    // https://xmpp.org/rfcs/rfc6120.html#streams-error-conditions-bad-format
    // "This error can be used instead of the more specific XML-related errors,
    // such as <bad-namespace-prefix/>, <invalid-xml/>, <not-well-formed/>, <restricted-xml/>,
    // and <unsupported-encoding/>. However, the more specific errors are RECOMMENDED."
    this._streamError("bad-format");
    this._detachParser();
    this.emit("error", error);
  }

  #onSocketClosed(dirty, reason) {
    this._detachSocket();
    this._status("disconnect", { clean: !dirty, reason });
  }

  #onStreamClosed(dirty, reason) {
    this._detachParser();
    this._status("close", { clean: !dirty, reason });
  }

  _attachSocket(socket) {
    this.socket = socket;
    this.#socketListeners ??= listeners({
      data: this._onData.bind(this),
      close: this.#onSocketClosed.bind(this),
      connect: () => this._status("connect"),
      error: (error) => this.emit("error", error),
    });
    this.#socketListeners.subscribe(this.socket);
  }

  _detachSocket() {
    this.socket && this.#socketListeners?.unsubscribe(this.socket);
    this.socket = null;
  }

  _onElement(element) {
    const isStreamError = element.is("error", NS_JABBER_STREAM);

    if (isStreamError) {
      this._onStreamError(element);
    }

    this.emit("element", element);
    this.emit(this.isStanza(element) ? "stanza" : "nonza", element);

    if (isStreamError) {
      // "Stream Errors Are Unrecoverable"
      // "The entity that receives the stream error then SHALL close the stream"
      this.disconnect();
    }
  }

  // https://xmpp.org/rfcs/rfc6120.html#streams-error
  _onStreamError(element) {
    const error = StreamError.fromElement(element);

    if (error.condition === "see-other-host") {
      return this._onSeeOtherHost(error);
    }

    this.emit("error", error);
  }

  // https://xmpp.org/rfcs/rfc6120.html#streams-error-conditions-see-other-host
  async _onSeeOtherHost(error) {
    const { protocol } = parseService(this.options.service);

    const host = error.element.getChildText("see-other-host");
    const { port } = parseHost(host);

    let service;
    service = port
      ? `${protocol || "xmpp:"}//${host}`
      : (protocol ? `${protocol}//` : "") + host;

    try {
      await promise(this, "disconnect");
      const { domain, lang } = this.options;
      await this.connect(service);
      await this.open({ domain, lang });
    } catch (err) {
      this.emit("error", err);
    }
  }

  _attachParser(parser) {
    this.parser = parser;
    this.#parserListeners ??= listeners({
      element: this._onElement.bind(this),
      error: this.#onParserError.bind(this),
      end: this.#onStreamClosed.bind(this),
      start: (element) => this._status("open", element),
    });
    this.#parserListeners.subscribe(this.parser);
  }

  _detachParser() {
    this.parser && this.#parserListeners?.unsubscribe(this.parser);
    this.parser = null;
    this.root = null;
  }

  _jid(id) {
    this.jid = jid(id);
    return this.jid;
  }

  /*
  [
    "offline",
    // "disconnect",
    "connecting",
    "connected",
    "opening",
    "open",
    "online",
    "closing",
    "close",
    "disconnecting",
    "disconnect",
    "offline",
  ];
  */
  _status(status, ...args) {
    if (this.status === status) return;
    this.status = status;
    this.emit("status", status, ...args);
    this.emit(status, ...args);
  }

  _ready(resumed = false) {
    if (resumed) {
      this.status = "online";
    } else {
      this._status("online", this.jid);
    }
  }

  async disconnect() {
    let el;

    try {
      el = await this._closeStream();
    } catch (err) {
      this.#onStreamClosed(err);
    }

    try {
      await this._closeSocket();
    } catch (err) {
      this.#onSocketClosed(true, err);
    }

    return el;
  }

  /**
   * Opens the socket then opens the stream
   */
  async start() {
    if (this.status !== "offline") {
      throw new Error("Connection is not offline");
    }

    const { service, domain, lang } = this.options;

    await this.connect(service);

    const promiseOnline = promise(this, "online");

    await this.open({ domain, lang });

    return promiseOnline;
  }

  /**
   * Connects the socket
   */
  async connect(service) {
    this._status("connecting", service);
    const socket = new this.Socket();
    this._attachSocket(socket);
    // The 'connect' status is set by the socket 'connect' listener
    socket.connect(this.socketParameters(service));
    return promise(socket, "connect");
  }

  /**
   * Disconnects the socket
   * https://xmpp.org/rfcs/rfc6120.html#streams-close
   * https://tools.ietf.org/html/rfc7395#section-3.6
   */
  async _closeSocket(timeout = this.timeout) {
    this._status("disconnecting");
    this.socket.end();

    // The 'disconnect' status is set by the socket 'close' listener
    await promise(this.socket, "close", "error", timeout);
  }

  /**
   * Opens the stream
   */
  async open(options) {
    this._status("opening");

    const { domain, lang } = options;

    const headerElement = this.headerElement();
    headerElement.attrs.to = domain;
    headerElement.attrs["xml:lang"] = lang;
    this.root = headerElement;

    this._attachParser(new this.Parser());

    await this.write(this.header(headerElement));
    return promise(this, "open", "error", this.timeout);
  }

  /**
   * Closes the stream then closes the socket
   * https://xmpp.org/rfcs/rfc6120.html#streams-close
   * https://tools.ietf.org/html/rfc7395#section-3.6
   */
  async stop() {
    const el = await this.disconnect();
    this._status("offline", el);
    return el;
  }

  /**
   * Closes the stream and wait for the server to close it
   * https://xmpp.org/rfcs/rfc6120.html#streams-close
   * https://tools.ietf.org/html/rfc7395#section-3.6
   */
  async _closeStream(timeout = this.timeout) {
    await this.#runHooks("close");

    const fragment = this.footer(this.footerElement());

    await this.write(fragment);
    this._status("closing");
    return promise(this.parser, "end", "error", timeout);
    // The 'close' status is set by the parser 'end' listener
  }

  /**
   * Restart the stream
   * https://xmpp.org/rfcs/rfc6120.html#streams-negotiation-restart
   */
  async restart() {
    this._detachParser();
    const { domain, lang } = this.options;
    return this.open({ domain, lang });
  }

  async send(element) {
    element.parent = this.root;
    await this.write(element.toString());
    this.emit("send", element);
  }

  sendReceive(element, timeout = this.timeout) {
    return Promise.all([
      this.send(element),
      promise(this, "element", "error", timeout),
    ]).then(([, el]) => el);
  }

  async write(string) {
    // https://xmpp.org/rfcs/rfc6120.html#streams-close
    // "Refrain from sending any further data over its outbound stream to the other entity"
    if (this.status === "closing") {
      throw new Error("Connection is closing");
    }

    return new Promise((resolve, reject) => {
      this.socket.write(string, (err) => (err ? reject(err) : resolve()));
    });
  }

  isStanza(element) {
    const { name } = element;
    return name === "iq" || name === "message" || name === "presence";
  }

  isNonza(element) {
    return !this.isStanza(element);
  }

  // Override
  header(el) {
    return el.toString();
  }

  // Override
  headerElement() {
    return new xml.Element("", {
      version: "1.0",
      xmlns: this.NS,
    });
  }

  // Override
  footer(el) {
    return el.toString();
  }

  // Override
  footerElement() {}

  // Override
  socketParameters() {}

  /* Experimental hooks */
  #hooks = new Map();
  #hook_events = new Set(["close"]);
  hook(event, handler /*priority = 0 TODO */) {
    this.#assertHookEventName(event);

    if (!this.#hooks.has(event)) {
      this.#hooks.set(event, new Set());
    }

    this.#hooks.get(event).add([handler]);
  }
  #assertHookEventName(event) {
    if (!this.#hook_events.has(event)) {
      throw new Error(`Hook event name "${event}" is unknown.`);
    }
  }
  unhook(event, handler) {
    this.#assertHookEventName(event);
    const handlers = this.#hooks.get("event");
    const item = [...handlers].find((item) => item.handler === handler);
    handlers.remove(item);
  }
  async #runHooks(event, ...args) {
    this.#assertHookEventName(event);

    const hooks = this.#hooks.get(event);
    if (!hooks) return;

    // TODO run hooks by priority
    // run hooks with the same priority in parallel

    await Promise.all(
      [...hooks].map(async ([handler]) => {
        try {
          await handler(...args);
        } catch (err) {
          this.emit("error", err);
        }
      }),
    );
  }
}

// Override
Connection.prototype.NS = "";
Connection.prototype.Socket = null;
Connection.prototype.Parser = null;

export default Connection;
