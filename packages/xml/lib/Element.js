"use strict";

const _Element = require("ltx/lib/Element");

class Element extends _Element {
  setAttrs(attrs) {
    if (typeof attrs === "string") {
      this.attrs.xmlns = attrs;
    } else if (attrs) {
      for (const key of Object.keys(attrs)) {
        // https://github.com/facebook/react/pull/4596
        // https://www.npmjs.com/package/babel-plugin-transform-react-jsx-source
        if (key === "__source" || key === "__self") continue;
        const val = attrs[key];
        if (val !== undefined && val !== null)
          this.attrs[key.toString()] = val.toString();
      }
    }
  }

  append(nodes) {
    nodes = Array.isArray(nodes) ? nodes : [nodes];
    for (const node of nodes) {
      this.children.push(node);
      if (typeof node === "object") {
        node.parent = this;
      }
    }
    return this;
  }

  prepend(nodes) {
    nodes = Array.isArray(nodes) ? nodes : [nodes];
    for (const node of nodes) {
      this.children.unshift(node);
      if (typeof node === "object") {
        node.parent = this;
      }
    }
    return this;
  }
}

module.exports = Element;
