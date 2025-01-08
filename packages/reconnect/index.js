import { EventEmitter } from "@xmpp/events";

class Reconnect extends EventEmitter {
  constructor(entity) {
    super();

    this.delay = 1000;
    this.entity = entity;
    this._timeout = null;
  }

  #onDisconnect = () => {
    this.scheduleReconnect();
  };

  scheduleReconnect() {
    const { entity, delay, _timeout } = this;
    clearTimeout(_timeout);
    this._timeout = setTimeout(async () => {
      if (entity.status !== "disconnect") {
        return;
      }

      try {
        await this.reconnect();
      } catch {
        // Ignoring the rejection is safe because the error is emitted on entity by #start
      }
    }, delay);
  }

  async reconnect() {
    const { entity } = this;
    this.emit("reconnecting");

    const { service, domain, lang } = entity.options;
    await entity.connect(service);
    await entity.open({ domain, lang });

    this.emit("reconnected");
  }

  start() {
    const { entity } = this;
    entity.on("disconnect", this.#onDisconnect);
  }

  stop() {
    const { entity, _timeout } = this;
    entity.removeListener("disconnect", this.#onDisconnect);
    clearTimeout(_timeout);
  }
}

export default function reconnect({ entity }) {
  const r = new Reconnect(entity);
  r.start();
  return r;
}
