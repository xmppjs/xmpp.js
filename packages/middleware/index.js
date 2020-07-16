/* eslint prefer-rest-params: "off" */

"use strict";

const compose = require("koa-compose");

const IncomingContext = require("./lib/IncomingContext");
const OutgoingContext = require("./lib/OutgoingContext");

function condition(elName /* , subName, subNs, elType, handler */) {
  const args = {
    handler: arguments[arguments.length - 1],
    name: elName,
    type: "*",
    childName: "*",
    childNS: "*",
  };

  if (arguments.length > 2) {
    args.childName = arguments[1];
  }

  if (arguments.length > 3) {
    args.childNS = arguments[2];
  }

  if (arguments.length > 4) {
    args.type = arguments[3];
  }

  return (ctx, next) => {
    if (ctx.stanza.is(args.name)) {
      if (args.type === "*" || ctx.type === args.type) {
        if (args.childName === "*" && args.childNS === "*") {
          return args.handler(ctx, next);
        }

        const element = ctx.stanza.getChildrenByFilter((child) => {
          if (
            (args.childName === "*" || child.name === args.childName) &&
            (args.childNS === "*" || child.attrs.xmlns === args.childNS)
          ) {
            return child;
          }

          return false;
        }, true)[0];

        if (element) {
          return args.handler(ctx, next);
        }
      }
    }

    return next();
  };
}

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
      if (arguments.length > 1) {
        fn = Reflect.apply(condition, this, arguments);
      }

      incoming.push(fn);
      return fn;
    },
    filter(fn) {
      if (arguments.length > 1) {
        fn = Reflect.apply(condition, this, arguments);
      }

      outgoing.push(fn);
      return fn;
    },
  };
};
