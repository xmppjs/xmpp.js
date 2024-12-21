import compose from "koa-compose";

import IncomingContext from "./lib/IncomingContext.js";
import OutgoingContext from "./lib/OutgoingContext.js";

function listener(entity, middleware, Context) {
  return (stanza) => {
    const ctx = new Context(entity, stanza);
    return compose(middleware)(ctx);
  };
}

function errorHandler(entity) {
  return (ctx, next) => {
    next()
      .then((reply) => reply && entity.send(reply))
      .catch((err) => entity.emit("error", err));
  };
}

export default function middleware({ entity }) {
  const incoming = [errorHandler(entity)];
  const outgoing = [];

  const incomingListener = listener(entity, incoming, IncomingContext);
  const outgoingListener = listener(entity, outgoing, OutgoingContext);

  entity.on("element", incomingListener);
  entity.on("send", outgoingListener);

  return {
    use(fn) {
      incoming.push(fn);
      return fn;
    },
    filter(fn) {
      outgoing.push(fn);
      return fn;
    },
  };
}
