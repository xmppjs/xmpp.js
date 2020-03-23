"use strict";

const compose = require("koa-compose");

const IncomingContext = require("./lib/IncomingContext");
const OutgoingContext = require("./lib/OutgoingContext");

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

module.exports = function middleware({ entity }) {
  const incoming = [errorHandler(entity)];
  const outgoing = [];

  const incomingListener = listener(entity, incoming, IncomingContext);
  const outgoingListener = listener(entity, outgoing, OutgoingContext);

  entity.on("element", incomingListener);
  entity.hookOutgoing = outgoingListener;

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
};
