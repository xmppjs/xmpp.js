(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){

},{}],2:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      } else {
        // At least give some kind of context to the user
        var err = new Error('Uncaught, unspecified "error" event. (' + er + ')');
        err.context = er;
        throw err;
      }
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        args = Array.prototype.slice.call(arguments, 1);
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    args = Array.prototype.slice.call(arguments, 1);
    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      if (typeof console.trace === 'function') {
        // not supported in IE 10
        console.trace();
      }
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else if (listeners) {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.prototype.listenerCount = function(type) {
  if (this._events) {
    var evlistener = this._events[type];

    if (isFunction(evlistener))
      return 1;
    else if (evlistener)
      return evlistener.length;
  }
  return 0;
};

EventEmitter.listenerCount = function(emitter, type) {
  return emitter.listenerCount(type);
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}

},{}],3:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],4:[function(require,module,exports){
'use strict'

var parse = require('./lib/parse')
var Parser = require('./lib/Parser')
var escape = require('./lib/escape')
var Element = require('./lib/Element')
var equal = require('./lib/equal')
var createElement = require('./lib/createElement')
var tag = require('./lib/tag')
var tagString = require('./lib/tagString')
var is = require('./lib/is')
var clone = require('./lib/clone')
var stringify = require('./lib/stringify')

exports = module.exports = function ltx () {
  return tag.apply(null, arguments)
}

exports.Element = Element

exports.equal = equal.equal
exports.nameEqual = equal.name
exports.attrsEqual = equal.attrs
exports.childrenEqual = equal.children

exports.isNode = is.isNode
exports.isElement = is.isElement
exports.isText = is.isText

exports.clone = clone
exports.createElement = createElement

exports.escapeXML = escape.escapeXML
exports.unescapeXML = escape.unescapeXML
exports.escapeXMLText = escape.escapeXMLText
exports.unescapeXMLText = escape.unescapeXMLText

exports.Parser = Parser
exports.parse = parse

exports.tag = tag
exports.tagString = tagString

exports.stringify = stringify

},{"./lib/Element":5,"./lib/Parser":6,"./lib/clone":7,"./lib/createElement":8,"./lib/equal":9,"./lib/escape":10,"./lib/is":11,"./lib/parse":12,"./lib/stringify":14,"./lib/tag":15,"./lib/tagString":16}],5:[function(require,module,exports){
'use strict'

var escape = require('./escape')
var escapeXML = escape.escapeXML
var escapeXMLText = escape.escapeXMLText

var equality = require('./equal')
var equal = equality.equal
var nameEqual = equality.name
var attrsEqual = equality.attrs
var childrenEqual = equality.children

var clone = require('./clone')

/**
 * Element
 *
 * Attributes are in the element.attrs object. Children is a list of
 * either other Elements or Strings for text content.
 **/
function Element (name, attrs) {
  this.name = name
  this.parent = null
  this.children = []
  this.attrs = {}
  this.setAttrs(attrs)
}

/* Accessors */

/**
 * if (element.is('message', 'jabber:client')) ...
 **/
Element.prototype.is = function (name, xmlns) {
  return (this.getName() === name) &&
  (!xmlns || (this.getNS() === xmlns))
}

/* without prefix */
Element.prototype.getName = function () {
  if (this.name.indexOf(':') >= 0) {
    return this.name.substr(this.name.indexOf(':') + 1)
  } else {
    return this.name
  }
}

/**
 * retrieves the namespace of the current element, upwards recursively
 **/
Element.prototype.getNS = function () {
  if (this.name.indexOf(':') >= 0) {
    var prefix = this.name.substr(0, this.name.indexOf(':'))
    return this.findNS(prefix)
  }
  return this.findNS()
}

/**
 * find the namespace to the given prefix, upwards recursively
 **/
Element.prototype.findNS = function (prefix) {
  if (!prefix) {
    /* default namespace */
    if (this.attrs.xmlns) {
      return this.attrs.xmlns
    } else if (this.parent) {
      return this.parent.findNS()
    }
  } else {
    /* prefixed namespace */
    var attr = 'xmlns:' + prefix
    if (this.attrs[attr]) {
      return this.attrs[attr]
    } else if (this.parent) {
      return this.parent.findNS(prefix)
    }
  }
}

/**
 * Recursiverly gets all xmlns defined, in the form of {url:prefix}
 **/
Element.prototype.getXmlns = function () {
  var namespaces = {}

  if (this.parent) {
    namespaces = this.parent.getXmlns()
  }

  for (var attr in this.attrs) {
    var m = attr.match('xmlns:?(.*)')
    if (this.attrs.hasOwnProperty(attr) && m) {
      namespaces[this.attrs[attr]] = m[1]
    }
  }
  return namespaces
}

Element.prototype.setAttrs = function (attrs) {
  if (typeof attrs === 'string') {
    this.attrs.xmlns = attrs
  } else if (attrs) {
    Object.keys(attrs).forEach(function (key) {
      this.attrs[key] = attrs[key]
    }, this)
  }
}

/**
 * xmlns can be null, returns the matching attribute.
 **/
Element.prototype.getAttr = function (name, xmlns) {
  if (!xmlns) {
    return this.attrs[name]
  }

  var namespaces = this.getXmlns()

  if (!namespaces[xmlns]) {
    return null
  }

  return this.attrs[[namespaces[xmlns], name].join(':')]
}

/**
 * xmlns can be null
 **/
Element.prototype.getChild = function (name, xmlns) {
  return this.getChildren(name, xmlns)[0]
}

/**
 * xmlns can be null
 **/
Element.prototype.getChildren = function (name, xmlns) {
  var result = []
  for (var i = 0; i < this.children.length; i++) {
    var child = this.children[i]
    if (child.getName &&
      (child.getName() === name) &&
      (!xmlns || (child.getNS() === xmlns))) {
      result.push(child)
    }
  }
  return result
}

/**
 * xmlns and recursive can be null
 **/
Element.prototype.getChildByAttr = function (attr, val, xmlns, recursive) {
  return this.getChildrenByAttr(attr, val, xmlns, recursive)[0]
}

/**
 * xmlns and recursive can be null
 **/
Element.prototype.getChildrenByAttr = function (attr, val, xmlns, recursive) {
  var result = []
  for (var i = 0; i < this.children.length; i++) {
    var child = this.children[i]
    if (child.attrs &&
      (child.attrs[attr] === val) &&
      (!xmlns || (child.getNS() === xmlns))) {
      result.push(child)
    }
    if (recursive && child.getChildrenByAttr) {
      result.push(child.getChildrenByAttr(attr, val, xmlns, true))
    }
  }
  if (recursive) {
    result = [].concat.apply([], result)
  }
  return result
}

Element.prototype.getChildrenByFilter = function (filter, recursive) {
  var result = []
  for (var i = 0; i < this.children.length; i++) {
    var child = this.children[i]
    if (filter(child)) {
      result.push(child)
    }
    if (recursive && child.getChildrenByFilter) {
      result.push(child.getChildrenByFilter(filter, true))
    }
  }
  if (recursive) {
    result = [].concat.apply([], result)
  }
  return result
}

Element.prototype.getText = function () {
  var text = ''
  for (var i = 0; i < this.children.length; i++) {
    var child = this.children[i]
    if ((typeof child === 'string') || (typeof child === 'number')) {
      text += child
    }
  }
  return text
}

Element.prototype.getChildText = function (name, xmlns) {
  var child = this.getChild(name, xmlns)
  return child ? child.getText() : null
}

/**
 * Return all direct descendents that are Elements.
 * This differs from `getChildren` in that it will exclude text nodes,
 * processing instructions, etc.
 */
Element.prototype.getChildElements = function () {
  return this.getChildrenByFilter(function (child) {
    return child instanceof Element
  })
}

/* Builder */

/** returns uppermost parent */
Element.prototype.root = function () {
  if (this.parent) {
    return this.parent.root()
  }
  return this
}
Element.prototype.tree = Element.prototype.root

/** just parent or itself */
Element.prototype.up = function () {
  if (this.parent) {
    return this.parent
  }
  return this
}

/** create child node and return it */
Element.prototype.c = function (name, attrs) {
  return this.cnode(new Element(name, attrs))
}

Element.prototype.cnode = function (child) {
  this.children.push(child)
  if (typeof child === 'object') {
    child.parent = this
  }
  return child
}

/** add text node and return element */
Element.prototype.t = function (text) {
  this.children.push(text)
  return this
}

/* Manipulation */

/**
 * Either:
 *   el.remove(childEl)
 *   el.remove('author', 'urn:...')
 */
Element.prototype.remove = function (el, xmlns) {
  var filter
  if (typeof el === 'string') {
    /* 1st parameter is tag name */
    filter = function (child) {
      return !(child.is &&
      child.is(el, xmlns))
    }
  } else {
    /* 1st parameter is element */
    filter = function (child) {
      return child !== el
    }
  }

  this.children = this.children.filter(filter)

  return this
}

Element.prototype.clone = function () {
  return clone(this)
}

Element.prototype.text = function (val) {
  if (val && this.children.length === 1) {
    this.children[0] = val
    return this
  }
  return this.getText()
}

Element.prototype.attr = function (attr, val) {
  if (typeof val !== 'undefined' || val === null) {
    if (!this.attrs) {
      this.attrs = {}
    }
    this.attrs[attr] = val
    return this
  }
  return this.attrs[attr]
}

/* Serialization */

Element.prototype.toString = function () {
  var s = ''
  this.write(function (c) {
    s += c
  })
  return s
}

Element.prototype.toJSON = function () {
  return {
    name: this.name,
    attrs: this.attrs,
    children: this.children.map(function (child) {
      return child && child.toJSON ? child.toJSON() : child
    })
  }
}

Element.prototype._addChildren = function (writer) {
  writer('>')
  for (var i = 0; i < this.children.length; i++) {
    var child = this.children[i]
    /* Skip null/undefined */
    if (child || (child === 0)) {
      if (child.write) {
        child.write(writer)
      } else if (typeof child === 'string') {
        writer(escapeXMLText(child))
      } else if (child.toString) {
        writer(escapeXMLText(child.toString(10)))
      }
    }
  }
  writer('</')
  writer(this.name)
  writer('>')
}

Element.prototype.write = function (writer) {
  writer('<')
  writer(this.name)
  for (var k in this.attrs) {
    var v = this.attrs[k]
    if (v != null) { // === null || undefined
      writer(' ')
      writer(k)
      writer('="')
      if (typeof v !== 'string') {
        v = v.toString()
      }
      writer(escapeXML(v))
      writer('"')
    }
  }
  if (this.children.length === 0) {
    writer('/>')
  } else {
    this._addChildren(writer)
  }
}

Element.prototype.nameEquals = function (el) {
  return nameEqual(this, el)
}

Element.prototype.attrsEquals = function (el) {
  return attrsEqual(this, el)
}

Element.prototype.childrenEquals = function (el) {
  return childrenEqual(this, el)
}

Element.prototype.equals = function (el) {
  return equal(this, el)
}

module.exports = Element

},{"./clone":7,"./equal":9,"./escape":10}],6:[function(require,module,exports){
'use strict'

var EventEmitter = require('events').EventEmitter
var inherits = require('inherits')
var Element = require('./Element')
var LtxParser = require('./parsers/ltx')

var Parser = function (options) {
  EventEmitter.call(this)

  var ParserInterface = this.Parser = (options && options.Parser) || this.DefaultParser
  var ElementInterface = this.Element = (options && options.Element) || this.DefaultElement

  this.parser = new ParserInterface()

  var el
  var self = this
  this.parser.on('startElement', function (name, attrs) {
    var child = new ElementInterface(name, attrs)
    if (!el) {
      el = child
    } else {
      el = el.cnode(child)
    }
  })
  this.parser.on('endElement', function (name) {
    if (!el) {
      /* Err */
    } else if (name === el.name) {
      if (el.parent) {
        el = el.parent
      } else if (!self.tree) {
        self.tree = el
        el = undefined
      }
    }
  })
  this.parser.on('text', function (str) {
    if (el) {
      el.t(str)
    }
  })
  this.parser.on('error', function (e) {
    self.error = e
    self.emit('error', e)
  })
}

inherits(Parser, EventEmitter)

Parser.prototype.DefaultParser = LtxParser

Parser.prototype.DefaultElement = Element

Parser.prototype.write = function (data) {
  this.parser.write(data)
}

Parser.prototype.end = function (data) {
  this.parser.end(data)

  if (!this.error) {
    if (this.tree) {
      this.emit('tree', this.tree)
    } else {
      this.emit('error', new Error('Incomplete document'))
    }
  }
}

module.exports = Parser

},{"./Element":5,"./parsers/ltx":13,"events":2,"inherits":3}],7:[function(require,module,exports){
'use strict'

module.exports = function clone (el) {
  var clone = new el.constructor(el.name, el.attrs)
  for (var i = 0; i < el.children.length; i++) {
    var child = el.children[i]
    clone.cnode(child.clone ? child.clone() : child)
  }
  return clone
}

},{}],8:[function(require,module,exports){
'use strict'

var Element = require('./Element')

/**
 * JSX compatible API, use this function as pragma
 * https://facebook.github.io/jsx/
 *
 * @param  {string} name  name of the element
 * @param  {object} attrs object of attribute key/value pairs
 * @return {Element}      Element
 */
module.exports = function createElement (name, attrs /*, child1, child2, ... */) {
  var el = new Element(name, attrs)

  for (var i = 2; i < arguments.length; i++) {
    var child = arguments[i]
    if (child) el.cnode(child)
  }

  return el
}

},{"./Element":5}],9:[function(require,module,exports){
'use strict'

function nameEqual (a, b) {
  return a.name === b.name
}

function attrsEqual (a, b) {
  var attrs = a.attrs
  var keys = Object.keys(attrs)
  var length = keys.length
  if (length !== Object.keys(b.attrs).length) return false
  for (var i = 0, l = length; i < l; i++) {
    var key = keys[i]
    var value = attrs[key]
    if (value == null || b.attrs[key] == null) { // === null || undefined
      if (value !== b.attrs[key]) return false
    } else if (value.toString() !== b.attrs[key].toString()) {
      return false
    }
  }
  return true
}

function childrenEqual (a, b) {
  var children = a.children
  var length = children.length
  if (length !== b.children.length) return false
  for (var i = 0, l = length; i < l; i++) {
    var child = children[i]
    if (typeof child === 'string') {
      if (child !== b.children[i]) return false
    } else {
      if (!child.equals(b.children[i])) return false
    }
  }
  return true
}

function equal (a, b) {
  if (!nameEqual(a, b)) return false
  if (!attrsEqual(a, b)) return false
  if (!childrenEqual(a, b)) return false
  return true
}

module.exports.name = nameEqual
module.exports.attrs = attrsEqual
module.exports.children = childrenEqual
module.exports.equal = equal

},{}],10:[function(require,module,exports){
'use strict'

var escapeXMLTable = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  '\'': '&apos;'
}

function escapeXMLReplace (match) {
  return escapeXMLTable[match]
}

var unescapeXMLTable = {
  '&amp;': '&',
  '&#38;': '&',
  '&lt;': '<',
  '&#60;': '<',
  '&gt;': '>',
  '&#62;': '>',
  '&quot;': '"',
  '&#34;': '"',
  '&apos;': "'",
  '&#39;': "'"
}

function unescapeXMLReplace (match) {
  return unescapeXMLTable[match]
}

exports.escapeXML = function escapeXML (s) {
  return s.replace(/&|<|>|"|'/g, escapeXMLReplace)
}

exports.unescapeXML = function unescapeXML (s) {
  return s.replace(/&(amp|#38|lt|#60|gt|#62|quot|#34|apos|#39);/g, unescapeXMLReplace)
}

exports.escapeXMLText = function escapeXMLText (s) {
  return s.replace(/&|<|>/g, escapeXMLReplace)
}

exports.unescapeXMLText = function unescapeXMLText (s) {
  return s.replace(/&(amp|#38|lt|#60|gt|#62);/g, unescapeXMLReplace)
}

},{}],11:[function(require,module,exports){
'use strict'

var Element = require('./Element')

module.exports.isNode = function is (el) {
  return el instanceof Element || typeof el === 'string'
}

module.exports.isElement = function isElement (el) {
  return el instanceof Element
}

module.exports.isText = function isText (el) {
  return typeof el === 'string'
}

},{"./Element":5}],12:[function(require,module,exports){
'use strict'

var Parser = require('./Parser')

module.exports = function parse (data, options) {
  var p
  if (typeof options === 'function') {
    p = new options() // eslint-disable-line
  } else {
    p = new Parser(options)
  }

  var result = null
  var error = null

  p.on('tree', function (tree) {
    result = tree
  })
  p.on('error', function (e) {
    error = e
  })

  p.write(data)
  p.end()

  if (error) {
    throw error
  } else {
    return result
  }
}

},{"./Parser":6}],13:[function(require,module,exports){
'use strict'

var inherits = require('inherits')
var EventEmitter = require('events').EventEmitter
var unescapeXML = require('../escape').unescapeXML

var STATE_TEXT = 0
var STATE_IGNORE_COMMENT = 1
var STATE_IGNORE_INSTRUCTION = 2
var STATE_TAG_NAME = 3
var STATE_TAG = 4
var STATE_ATTR_NAME = 5
var STATE_ATTR_EQ = 6
var STATE_ATTR_QUOT = 7
var STATE_ATTR_VALUE = 8
var STATE_CDATA = 9

var SaxLtx = module.exports = function SaxLtx () {
  EventEmitter.call(this)

  var state = STATE_TEXT
  var remainder
  var tagName
  var attrs
  var endTag
  var selfClosing
  var attrQuote
  var recordStart = 0
  var attrName

  this._handleTagOpening = function (endTag, tagName, attrs) {
    if (!endTag) {
      this.emit('startElement', tagName, attrs)
      if (selfClosing) {
        this.emit('endElement', tagName)
      }
    } else {
      this.emit('endElement', tagName)
    }
  }

  this.write = function (data) {
    if (typeof data !== 'string') {
      data = data.toString()
    }
    var pos = 0

    /* Anything from previous write()? */
    if (remainder) {
      data = remainder + data
      pos += remainder.length
      remainder = null
    }

    function endRecording () {
      if (typeof recordStart === 'number') {
        var recorded = data.slice(recordStart, pos)
        recordStart = undefined
        return recorded
      }
    }

    for (; pos < data.length; pos++) {
      var c = data.charCodeAt(pos)
      switch (state) {
        case STATE_TEXT:
          if (c === 60 /* < */) {
            var text = endRecording()
            if (text) {
              this.emit('text', unescapeXML(text))
            }
            state = STATE_TAG_NAME
            recordStart = pos + 1
            attrs = {}
          }
          break
        case STATE_CDATA:
          if (c === 93 /* ] */ && data.substr(pos + 1, 2) === ']>') {
            var cData = endRecording()
            if (cData) {
              this.emit('text', cData)
            }
            state = STATE_IGNORE_COMMENT
          }
          break
        case STATE_TAG_NAME:
          if (c === 47 /* / */ && recordStart === pos) {
            recordStart = pos + 1
            endTag = true
          } else if (c === 33 /* ! */) {
            if (data.substr(pos + 1, 7) === '[CDATA[') {
              recordStart = pos + 8
              state = STATE_CDATA
            } else {
              recordStart = undefined
              state = STATE_IGNORE_COMMENT
            }
          } else if (c === 63 /* ? */) {
            recordStart = undefined
            state = STATE_IGNORE_INSTRUCTION
          } else if (c <= 32 || c === 47 /* / */ || c === 62 /* > */) {
            tagName = endRecording()
            pos--
            state = STATE_TAG
          }
          break
        case STATE_IGNORE_COMMENT:
          if (c === 62 /* > */) {
            var prevFirst = data.charCodeAt(pos - 1)
            var prevSecond = data.charCodeAt(pos - 2)
            if ((prevFirst === 45 /* - */ && prevSecond === 45 /* - */) ||
                (prevFirst === 93 /* ] */ && prevSecond === 93 /* ] */)) {
              state = STATE_TEXT
            }
          }
          break
        case STATE_IGNORE_INSTRUCTION:
          if (c === 62 /* > */) {
            var prev = data.charCodeAt(pos - 1)
            if (prev === 63 /* ? */) {
              state = STATE_TEXT
            }
          }
          break
        case STATE_TAG:
          if (c === 62 /* > */) {
            this._handleTagOpening(endTag, tagName, attrs)
            tagName = undefined
            attrs = undefined
            endTag = undefined
            selfClosing = undefined
            state = STATE_TEXT
            recordStart = pos + 1
          } else if (c === 47 /* / */) {
            selfClosing = true
          } else if (c > 32) {
            recordStart = pos
            state = STATE_ATTR_NAME
          }
          break
        case STATE_ATTR_NAME:
          if (c <= 32 || c === 61 /* = */) {
            attrName = endRecording()
            pos--
            state = STATE_ATTR_EQ
          }
          break
        case STATE_ATTR_EQ:
          if (c === 61 /* = */) {
            state = STATE_ATTR_QUOT
          }
          break
        case STATE_ATTR_QUOT:
          if (c === 34 /* " */ || c === 39 /* ' */) {
            attrQuote = c
            state = STATE_ATTR_VALUE
            recordStart = pos + 1
          }
          break
        case STATE_ATTR_VALUE:
          if (c === attrQuote) {
            var value = unescapeXML(endRecording())
            attrs[attrName] = value
            attrName = undefined
            state = STATE_TAG
          }
          break
      }
    }

    if (typeof recordStart === 'number' &&
      recordStart <= data.length) {
      remainder = data.slice(recordStart)
      recordStart = 0
    }
  }
  /*
  var origEmit = this.emit
  this.emit = function() {
    console.log('ltx', arguments)
    origEmit.apply(this, arguments)
  }
  */
}
inherits(SaxLtx, EventEmitter)

SaxLtx.prototype.end = function (data) {
  if (data) {
    this.write(data)
  }

  /* Uh, yeah */
  this.write = function () {}
}

},{"../escape":10,"events":2,"inherits":3}],14:[function(require,module,exports){
'use strict'

function stringify (el, indent, level) {
  if (typeof indent === 'number') indent = ' '.repeat(indent)
  if (!level) level = 1
  var s = ''
  s += '<' + el.name

  Object.keys(el.attrs).forEach(function (k) {
    s += ' ' + k + '=' + '"' + el.attrs[k] + '"'
  })

  if (el.children.length) {
    s += '>'
    el.children.forEach(function (child, i) {
      if (indent) s += '\n' + indent.repeat(level)
      if (typeof child === 'string') {
        s += child
      } else {
        s += stringify(child, indent, level + 1)
      }
    })
    if (indent) s += '\n' + indent.repeat(level - 1)
    s += '</' + el.name + '>'
  } else {
    s += '/>'
  }

  return s
}

module.exports = stringify

},{}],15:[function(require,module,exports){
'use strict'

var tagString = require('./tagString')
var parse = require('./parse')

module.exports = function tag (/* [literals], ...substitutions */) {
  return parse(tagString.apply(null, arguments))
}

},{"./parse":12,"./tagString":16}],16:[function(require,module,exports){
'use strict'

var escape = require('./escape').escapeXML

module.exports = function tagString (/* [literals], ...substitutions */) {
  var literals = arguments[0]

  var str = ''

  for (var i = 1; i < arguments.length; i++) {
    str += literals[i - 1]
    str += escape(arguments[i])
  }
  str += literals[literals.length - 1]

  return str
}

},{"./escape":10}],17:[function(require,module,exports){
'use strict';
const pReduce = require('p-reduce');

module.exports = (iterable, iterator) => {
	const ret = [];

	return pReduce(iterable, (a, b, i) => {
		return Promise.resolve(iterator(b, i)).then(val => {
			ret.push(val);
		});
	}).then(() => ret);
};

},{"p-reduce":18}],18:[function(require,module,exports){
'use strict';
module.exports = (iterable, reducer, initVal) => new Promise((resolve, reject) => {
	const iterator = iterable[Symbol.iterator]();
	let i = 0;

	const next = total => {
		const el = iterator.next();

		if (el.done) {
			resolve(total);
			return;
		}

		Promise.all([total, el.value])
			.then(value => {
				next(reducer(value[0], value[1], i++));
			})
			.catch(reject);
	};

	next(initVal);
});

},{}],19:[function(require,module,exports){
(function(root, factory) {
  if (typeof exports === 'object') {
    // CommonJS
    factory(exports, module);
  } else if (typeof define === 'function' && define.amd) {
    // AMD
    define(['exports', 'module'], factory);
  }
}(this, function(exports, module) {

  /**
   * ANONYMOUS `Mechanism` constructor.
   *
   * This class implements the ANONYMOUS SASL mechanism.
   *
   * The ANONYMOUS SASL mechanism provides support for permitting anonymous
   * access to various services
   *
   * References:
   *  - [RFC 4505](http://tools.ietf.org/html/rfc4505)
   *
   * @api public
   */
  function Mechanism() {
  }
  
  Mechanism.prototype.name = 'ANONYMOUS';
  Mechanism.prototype.clientFirst = true;
  
  /**
   * Encode a response using optional trace information.
   *
   * Options:
   *  - `trace`  trace information (optional)
   *
   * @param {Object} cred
   * @api public
   */
  Mechanism.prototype.response = function(cred) {
    return cred.trace || '';
  };
  
  /**
   * Decode a challenge issued by the server.
   *
   * @param {String} chal
   * @api public
   */
  Mechanism.prototype.challenge = function(chal) {
  };

  exports = module.exports = Mechanism;
  
}));

},{}],20:[function(require,module,exports){
(function(root, factory) {
  if (typeof exports === 'object') {
    // CommonJS
    factory(exports,
            module,
            require('./lib/mechanism'));
  } else if (typeof define === 'function' && define.amd) {
    // AMD
    define(['exports',
            'module',
            './lib/mechanism'], factory);
  }
}(this, function(exports, module, Mechanism) {

  exports = module.exports = Mechanism;
  exports.Mechanism = Mechanism;
  
}));

},{"./lib/mechanism":19}],21:[function(require,module,exports){
(function(root, factory) {
  if (typeof exports === 'object') {
    // CommonJS
    factory(exports, module);
  } else if (typeof define === 'function' && define.amd) {
    // AMD
    define(['exports', 'module'], factory);
  }
}(this, function(exports, module) {

  /**
   * PLAIN `Mechanism` constructor.
   *
   * This class implements the PLAIN SASL mechanism.
   *
   * The PLAIN SASL mechanism provides support for exchanging a clear-text
   * username and password.  This mechanism should not be used without adequate
   * security provided by an underlying transport layer. 
   *
   * References:
   *  - [RFC 4616](http://tools.ietf.org/html/rfc4616)
   *
   * @api public
   */
  function Mechanism() {
  }
  
  Mechanism.prototype.name = 'PLAIN';
  Mechanism.prototype.clientFirst = true;
  
  /**
   * Encode a response using given credential.
   *
   * Options:
   *  - `username`
   *  - `password`
   *  - `authzid`   authorization identity (optional)
   *
   * @param {Object} cred
   * @api public
   */
  Mechanism.prototype.response = function(cred) {
    var str = '';
    str += cred.authzid || '';
    str += '\0';
    str += cred.username;
    str += '\0';
    str += cred.password;
    return str;
  };
  
  /**
   * Decode a challenge issued by the server.
   *
   * @param {String} chal
   * @return {Mechanism} for chaining
   * @api public
   */
  Mechanism.prototype.challenge = function(chal) {
    return this;
  };

  exports = module.exports = Mechanism;
  
}));

},{}],22:[function(require,module,exports){
arguments[4][20][0].apply(exports,arguments)
},{"./lib/mechanism":21,"dup":20}],23:[function(require,module,exports){
(function(root, factory) {
  if (typeof exports === 'object') {
    // CommonJS
    factory(exports, module);
  } else if (typeof define === 'function' && define.amd) {
    // AMD
    define(['exports', 'module'], factory);
  }
}(this, function(exports, module) {
  
  /**
   * `Factory` constructor.
   *
   * @api public
   */
  function Factory() {
    this._mechs = [];
  }
  
  /**
   * Utilize the given `mech` with optional `name`, overridding the mechanism's
   * default name.
   *
   * Examples:
   *
   *     factory.use(FooMechanism);
   *
   *     factory.use('XFOO', FooMechanism);
   *
   * @param {String|Mechanism} name
   * @param {Mechanism} mech
   * @return {Factory} for chaining
   * @api public
   */
  Factory.prototype.use = function(name, mech) {
    if (!mech) {
      mech = name;
      name = mech.prototype.name;
    }
    this._mechs.push({ name: name, mech: mech });
    return this;
  };
  
  /**
   * Create a new mechanism from supported list of `mechs`.
   *
   * If no mechanisms are supported, returns `null`.
   *
   * Examples:
   *
   *     var mech = factory.create(['FOO', 'BAR']);
   *
   * @param {Array} mechs
   * @return {Mechanism}
   * @api public
   */
  Factory.prototype.create = function(mechs) {
    for (var i = 0, len = this._mechs.length; i < len; i++) {
      for (var j = 0, jlen = mechs.length; j < jlen; j++) {
        var entry = this._mechs[i];
        if (entry.name == mechs[j]) {
          return new entry.mech();
        }
      }
    }
    return null;
  };

  exports = module.exports = Factory;
  
}));

},{}],24:[function(require,module,exports){
(function(root, factory) {
  if (typeof exports === 'object') {
    // CommonJS
    factory(exports,
            module,
            require('./lib/factory'));
  } else if (typeof define === 'function' && define.amd) {
    // AMD
    define(['exports',
            'module',
            './lib/factory'], factory);
  }
}(this, function(exports, module, Factory) {
  
  exports = module.exports = Factory;
  exports.Factory = Factory;
  
}));

},{"./lib/factory":23}],25:[function(require,module,exports){
'use strict'

const Client = require('./lib/Client')
const xml = require('@xmpp/xml')
const jid = require('@xmpp/jid')

module.exports.Client = Client
module.exports.xml = xml
module.exports.jid = jid

},{"./lib/Client":26,"@xmpp/jid":41,"@xmpp/xml":64}],26:[function(require,module,exports){
'use strict'

const Connection = require('@xmpp/connection')

class Client extends Connection {
  constructor(options) {
    super(options)
    this.transports = []
  }

  send(element, ...args) {
    if (
      !element.attrs.xmlns &&
      (element.is('iq') || element.is('message') || element.is('presence'))
    ) {
      element.attrs.xmlns = 'jabber:client' // FIXME no need for TCP/TLS transports
    }
    return super.send(element, ...args)
  }

  connect(uri) {
    const Transport = this.transports.find(Transport => {
      try {
        return Transport.prototype.socketParameters(uri) !== undefined
      } catch (err) {
        return false
      }
    })

    if (!Transport) {
      throw new Error('No compatible connection method found.')
    }

    this.Transport = Transport
    this.Socket = Transport.prototype.Socket
    this.Parser = Transport.prototype.Parser

    return super.connect(uri)
  }

  socketParameters(...args) {
    return this.Transport.prototype.socketParameters(...args)
  }

  header(...args) {
    return this.Transport.prototype.header(...args)
  }

  headerElement(...args) {
    return this.Transport.prototype.headerElement(...args)
  }

  footer(...args) {
    return this.Transport.prototype.footer(...args)
  }

  footerElement(...args) {
    return this.Transport.prototype.footerElement(...args)
  }
}

Client.prototype.NS = 'jabber:client'

module.exports = Client

},{"@xmpp/connection":30}],27:[function(require,module,exports){
'use strict'

const entries = Object.entries || require('object.entries') // eslint-disable-line node/no-unsupported-features

const Client = require('./lib/Client')
const {xml, jid} = require('@xmpp/client-core')

const reconnect = require('@xmpp/reconnect')
const tcp = require('@xmpp/tcp')
const websocket = require('@xmpp/websocket')
const tls = require('@xmpp/tls')
const packages = {reconnect, tcp, websocket, tls}

function xmpp() {
  const client = new Client()
  return Object.assign(
    {client},
    ...entries(packages)
      // Ignore browserify stubs
      .filter(([, v]) => typeof v === 'function')
      .map(([k, v]) => [v(client), k])
  )
}

module.exports.Client = Client
module.exports.xml = xml
module.exports.jid = jid
module.exports.xmpp = xmpp

},{"./lib/Client":28,"@xmpp/client-core":25,"@xmpp/reconnect":56,"@xmpp/tcp":1,"@xmpp/tls":1,"@xmpp/websocket":60,"object.entries":1}],28:[function(require,module,exports){
'use strict'

const ClientCore = require('@xmpp/client-core').Client
const plugins = require('./plugins')

class Client extends ClientCore {
  constructor(...args) {
    super(...args)
    Object.keys(plugins).forEach(name => {
      const plugin = plugins[name]
      // Ignore browserify stubs
      if (!plugin.plugin) {
        return
      }
      this.plugin(plugin)
    })
  }
}

module.exports = Client

},{"./plugins":29,"@xmpp/client-core":25}],29:[function(require,module,exports){
'use strict'

exports['stream-features'] = require('@xmpp/plugins/stream-features')
exports.bind = require('@xmpp/plugins/bind')
exports.sasl = require('@xmpp/plugins/sasl')
exports['sasl-plain'] = require('@xmpp/plugins/sasl-plain')
exports['sasl-scram-sha-1'] = require('@xmpp/plugins/sasl-scram-sha-1')
exports['sasl-anonymous'] = require('@xmpp/plugins/sasl-anonymous')
exports.starttls = require('@xmpp/plugins/starttls')
exports.resolve = require('@xmpp/plugins/resolve')
exports[
  'session-establishment'
] = require('@xmpp/plugins/session-establishment')

},{"@xmpp/plugins/bind":47,"@xmpp/plugins/resolve":49,"@xmpp/plugins/sasl":52,"@xmpp/plugins/sasl-anonymous":50,"@xmpp/plugins/sasl-plain":51,"@xmpp/plugins/sasl-scram-sha-1":1,"@xmpp/plugins/session-establishment":54,"@xmpp/plugins/starttls":1,"@xmpp/plugins/stream-features":55}],30:[function(require,module,exports){
'use strict'

const {timeout, EventEmitter, promise} = require('@xmpp/events')
const jid = require('@xmpp/jid')
const url = require('url')
const xml = require('@xmpp/xml')

class XMPPError extends Error {
  constructor(condition, text, element) {
    super(condition + (text ? ` - ${text}` : ''))
    this.name = 'XMPPError'
    this.condition = condition
    this.text = text
    this.element = element
  }
}

class StreamError extends XMPPError {
  constructor(...args) {
    super(...args)
    this.name = 'StreamError'
  }
}

// We ignore url module from the browser bundle to reduce its size
function getHostname(uri) {
  if (url.parse) {
    const parsed = url.parse(uri)
    return parsed.hostname || parsed.pathname
  }
  const el = document.createElement('a') // eslint-disable-line no-undef
  el.href = uri
  return el.hostname
}

class Connection extends EventEmitter {
  constructor(options) {
    super()
    this.domain = ''
    this.lang = ''
    this.jid = null
    this.timeout = 2000
    this.options = typeof options === 'object' ? options : {}
    this.plugins = Object.create(null)
    this.startOptions = null
    this.openOptions = null
    this.connectOptions = null
    this.socketListeners = Object.create(null)
    this.parserListeners = Object.create(null)
    this.status = 'offline'
  }

  _reset() {
    this.domain = ''
    this.lang = ''
    this.jid = null
    this._detachSocket()
    this._detachParser()
    this.socket = null
  }

  _attachSocket(socket) {
    const sock = (this.socket = socket)
    const listeners = this.socketListeners
    listeners.data = data => {
      const str = data.toString('utf8')
      this.emit('input', str)
      this.parser.write(str)
    }
    listeners.close = (...args) => {
      this._reset()
      this._status('disconnect', ...args)
    }
    listeners.connect = () => {
      this._status('connect')
      sock.once('close', listeners.close)
    }
    listeners.error = error => {
      this._reset()
      if (this.status === 'connecting') {
        this._status('offline')
      }
      this.emit('error', error)
    }
    sock.on('data', listeners.data)
    sock.on('error', listeners.error)
    sock.on('connect', listeners.connect)
  }

  _detachSocket() {
    const listeners = this.socketListeners
    Object.getOwnPropertyNames(listeners).forEach(k => {
      this.socket.removeListener(k, listeners[k])
      delete listeners[k]
    })
    delete this.socket
  }

  _attachParser(p) {
    const parser = (this.parser = p)
    const listeners = this.parserListeners
    listeners.element = element => {
      if (element.name === 'stream:error') {
        this.close().then(() => this.disconnect())
        this.emit(
          'error',
          new StreamError(
            element.children[0].name,
            element.getChildText(
              'text',
              'urn:ietf:params:xml:ns:xmpp-streams'
            ) || '',
            element
          )
        )
      }
      this.emit('element', element)
      this.emit(this.isStanza(element) ? 'stanza' : 'nonza', element)
    }
    listeners.error = error => {
      this.emit('error', error)
    }
    listeners.end = element => {
      this._status('close', element)
    }
    parser.once('error', listeners.error)
    parser.on('element', listeners.element)
    parser.on('end', listeners.end)
  }

  _detachParser() {
    const listeners = this.parserListeners
    Object.getOwnPropertyNames(listeners).forEach(k => {
      this.parser.removeListener(k, listeners[k])
      delete listeners[k]
    })
    delete this.parser
  }

  _jid(id) {
    this.jid = jid(id)
    return this.jid
  }

  _status(status, ...args) {
    this.status = status
    this.emit('status', status, ...args)
    this.emit(status, ...args)
  }

  /**
   * Opens the socket then opens the stream
   */
  start(options) {
    if (this.status !== 'offline') {
      return Promise.reject(new Error('Connection is not offline'))
    }

    this.startOptions = options

    if (typeof options === 'string') {
      options = {uri: options}
    }

    if (!options.domain) {
      options.domain = getHostname(options.uri)
    }

    return Promise.all([
      this.promise('online'),
      this.connect(options.uri).then(() => {
        const {domain, lang} = options
        return this.open({domain, lang})
      }),
    ]).then(([addr]) => addr)
  }

  /**
   * Connects the socket
   */
  connect(options) {
    this._status('connecting')
    this.connectOptions = options
    return new Promise((resolve, reject) => {
      this._attachParser(new this.Parser())
      this._attachSocket(new this.Socket())
      this.socket.once('error', reject)
      this.socket.connect(this.socketParameters(options), () => {
        this.socket.removeListener('error', reject)
        resolve()
        // The 'connect' status is emitted by the socket 'connect' listener
      })
    })
  }

  /**
   * Disconnects the socket
   * https://xmpp.org/rfcs/rfc6120.html#streams-close
   * https://tools.ietf.org/html/rfc7395#section-3.6
   */
  disconnect(ms = this.timeout) {
    this._status('disconnecting')
    this.socket.end()
    return timeout(promise(this.socket, 'close'), ms)
    // The 'disconnect' status is emitted by the socket 'close' listener
  }

  /**
   * Opens the stream
   */
  open(options) {
    this._status('opening')
    // Useful for stream-features restart
    this.openOptions = options
    if (typeof options === 'string') {
      options = {domain: options}
    }

    const {domain, lang} = options

    const headerElement = this.headerElement()
    headerElement.attrs.to = domain
    headerElement.attrs['xml:lang'] = lang

    return Promise.all([
      this.write(this.header(headerElement)),
      promise(this.parser, 'start').then(el => {
        // FIXME what about version and xmlns:stream ?
        if (
          el.name !== headerElement.name ||
          el.attrs.xmlns !== headerElement.attrs.xmlns ||
          el.attrs.from !== headerElement.attrs.to ||
          !el.attrs.id
        ) {
          return this.promise('error')
        }

        this.domain = domain
        this.lang = el.attrs['xml:lang']
        this._status('open', el)
        return el
      }),
    ]).then(([, el]) => el)
  }

  /**
   * Closes the stream then closes the socket
   * https://xmpp.org/rfcs/rfc6120.html#streams-close
   * https://tools.ietf.org/html/rfc7395#section-3.6
   */
  stop() {
    if (!this.socket) {
      return Promise.resolve()
    }
    return this.close().then(el =>
      this.disconnect().then(() => {
        this._status('offline')
        return el
      })
    )
  }

  /**
   * Closes the stream and wait for the server to close it
   * https://xmpp.org/rfcs/rfc6120.html#streams-close
   * https://tools.ietf.org/html/rfc7395#section-3.6
   */
  close(ms = this.timeout) {
    this._status('closing')

    return Promise.all([
      timeout(promise(this.parser, 'end'), ms),
      this.write(this.footer(this.footerElement())),
    ]).then(([el]) => el)
    // The 'close' status is emitted by the parser 'end' listener
  }

  /**
   * Restart the stream
   * https://xmpp.org/rfcs/rfc6120.html#streams-negotiation-restart
   */
  restart() {
    this._detachParser()
    this._attachParser(new this.Parser())
    this._status('restarting')
    return this.open(this.openOptions).then(() => {
      this._status('restart')
    })
  }

  send(element) {
    this.emit('outgoing', element)

    const proceed = () => {
      return this.write(element).then(() => {
        this.emit('send', element)
      })
    }

    return this.hookOutgoing
      ? this.hookOutgoing(element).then(proceed)
      : proceed()
  }

  sendReceive(element, ms = this.timeout) {
    return Promise.all([
      this.send(element),
      timeout(this.promise('element'), ms),
    ]).then(([, el]) => el)
  }

  write(data) {
    return new Promise((resolve, reject) => {
      const str = data.toString('utf8')
      this.socket.write(str, err => {
        if (err) {
          return reject(err)
        }
        this.emit('output', str)
        resolve()
      })
    })
  }

  isStanza(element) {
    const {name} = element
    const NS = element.attrs.xmlns
    return (
      // This.online && FIXME
      (NS ? NS === this.NS : true) &&
      (name === 'iq' || name === 'message' || name === 'presence')
    )
  }

  isNonza(element) {
    return !this.isStanza(element)
  }

  plugin(plugin) {
    if (!this.plugins[plugin.name]) {
      this.plugins[plugin.name] = plugin.plugin(this)
      const p = this.plugins[plugin.name]
      if (p && p.start) {
        p.start()
      } else if (p && p.register) {
        p.register()
      }
    }

    return this.plugins[plugin.name]
  }

  // Override
  header(el) {
    return el.toString()
  }

  headerElement() {
    return new xml.Element('', {
      version: '1.0',
      xmlns: this.NS,
    })
  }

  footer(el) {
    return el.toString()
  }

  footerElement() {}

  socketParameters(uri) {
    const parsed = url.parse(uri)
    parsed.port = Number(parsed.port)
    parsed.host = parsed.hostname
    return parsed
  }
}

// Overrirde
Connection.prototype.NS = ''
Connection.prototype.Socket = null
Connection.prototype.Parser = null

module.exports = Connection
module.exports.getHostname = getHostname
module.exports.XMPPError = XMPPError
module.exports.StreamError = StreamError

},{"@xmpp/events":34,"@xmpp/jid":41,"@xmpp/xml":64,"url":1}],31:[function(require,module,exports){
'use strict'

const mapSeries = require('p-map-series')
const EventEmitter = require('events')
const {parse, stringify} = require('ltx')

class Console extends EventEmitter {
  constructor(entity) {
    super()
    this.entity = entity

    entity.on('input', data => this.input(data))
    entity.on('output', data => this.output(data))

    entity.on('connect', () => {
      this.info('connected')
    })

    entity.on('open', () => {
      this.info('open')
    })

    entity.on('authenticated', () => {
      this.info('authenticated')
    })

    entity.on('online', jid => {
      this.jid = jid
      this.info(`online ${jid.toString()}`)
    })

    entity.on('error', err => {
      this.error(err.message)
    })

    entity.on('close', () => {
      this.info('closed')
    })

    entity.on('authenticate', () => {
      this.info('authenticating')
    })

    const {sasl, register, bind, streamFeatures} = entity.plugins
    if (streamFeatures) {
      streamFeatures.onStreamFeatures = features => {
        const options = {
          text: 'Choose stream feature',
          cancelText: 'Done',
          choices: features.map(({name}) => name),
        }
        this.choose(options).then(feature => {
          return features.find(f => f.name === feature).run()
        })
      }
    }
    if (sasl) {
      sasl.getMechanism = mechs => {
        return this.choose({
          text: 'Choose SASL mechanism',
          choices: mechs,
        })
      }
    }
    if (register) {
      register.onFields = (fields, register) => {
        return this.ask({
          text: 'Choose username',
        }).then(username => {
          return this.ask({
            text: 'Choose password',
            type: 'password',
          }).then(password => register(username, password))
        })
      }
    }
    if (bind) {
      bind.getResource = () => {
        return this.ask({
          text: 'Enter resource or leave empty',
          value: 'console',
        })
      }
    }

    entity.handle('authenticate', (auth, mechanism) => {
      const options = [
        {
          text: 'Enter password',
          type: 'password',
        },
      ]

      // Client
      if (mechanism) {
        options.unshift({
          text: 'enter username',
        })
      }

      return this.askMultiple(options)
        .then(data => auth(...data))
        .catch(err => {
          this.error('authentication', err.message)
        })
    })

    entity.on('connect', () => {
      this.ask({
        text: 'Enter domain',
        value: 'localhost',
      }).then(domain => {
        entity.open({domain}).catch(err => {
          this.error('open - ', err.message)
        })
      })
    })
  }

  input(el) {
    this.log('⮈ IN', this.beautify(el))
  }

  output(el) {
    this.log('⮊ OUT', this.beautify(el))
  }

  beautify(frag) {
    let el
    if (typeof frag === 'string') {
      try {
        el = parse(frag)
      } catch (err) {
        return frag
      }
    } else {
      el = frag
    }
    return stringify(el, '  ')
  }

  askMultiple(options) {
    return mapSeries(options, o => this.ask(o))
  }

  parse(str) {
    try {
      return parse(str)
    } catch (err) {
      return str
    }
  }

  send(data) {
    let el
    try {
      el = parse(data)
    } catch (err) {
      this.error(`invalid XML "${data}"`)
      return
    }

    this.entity.send(el).then(() => {
      this.resetInput()
    })
  }

  resetInput() {}

  log(...args) {
    console.log(...args)
  }

  info(...args) {
    this.log('🛈 ', ...args)
  }

  warning(...args) {
    this.log('⚠ ', ...args)
  }

  error(...args) {
    this.log('❌ error ', ...args)
  }
}

module.exports = Console

},{"events":2,"ltx":4,"p-map-series":17}],32:[function(require,module,exports){
(function (global){
'use strict'

const {CodeMirror} = global

// https://codemirror.net/demo/xmlcomplete.html
function completeAfter(cm, pred) {
  if (!pred || pred()) {
    setTimeout(() => {
      if (!cm.state.completionActive) {
        cm.showHint({completeSingle: false})
      }
    }, 100)
  }
  return CodeMirror.Pass
}

function completeIfAfterLt(cm) {
  return completeAfter(cm, () => {
    const cur = cm.getCursor()
    return cm.getRange(CodeMirror.Pos(cur.line, cur.ch - 1), cur) === '<' // eslint-disable-line new-cap
  })
}

function completeIfInTag(cm) {
  return completeAfter(cm, () => {
    const tok = cm.getTokenAt(cm.getCursor())
    if (
      tok.type === 'string' &&
      (!/['"]/.test(tok.string.charAt(tok.string.length - 1)) ||
        tok.string.length === 1)
    ) {
      return false
    }
    const inner = CodeMirror.innerMode(cm.getMode(), tok.state).state
    return inner.tagName
  })
}

const tags = {
  '!top': ['iq', 'presence', 'message'],
  '!attrs': {
    id: null,
    'xml:lang': 'en',
    to: null,
    from: null,
    type: null,
    xmlns: null,
  },
  iq: {
    attrs: {
      type: ['get', 'set', 'result', 'error'],
    },
  },
  presence: {
    attrs: {
      type: [
        'subscribe',
        'unsubscribe',
        'probe',
        'error',
        'subscribed',
        'unsubscribed',
        'available',
        'unavailable',
      ],
    },
  },
  message: {
    attrs: {
      type: ['chat', 'normal'],
    },
  },
}

const editor = CodeMirror.fromTextArea(document.getElementById('editor'), {
  lineNumbers: true,
  mode: 'xml',
  gutters: ['CodeMirror-foldgutter'],
  foldGutter: true,
  autoCloseTags: true,
  matchTags: {bothTags: true},
  extraKeys: {
    "'<'": completeAfter,
    "'/'": completeIfAfterLt,
    "' '": completeIfInTag,
    "'='": completeIfInTag,
    'Ctrl-Space': 'autocomplete',
  },
  hintOptions: {schemaInfo: tags},
  theme: 'solarized light',
})

module.exports = editor

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],33:[function(require,module,exports){
(function (global){
'use strict'

const Console = require('../lib/Console')
const {xmpp} = require('@xmpp/client')
const editor = require('./editor')
const {Prism, fetch, notie} = global

Prism.plugins.toolbar.registerButton('edit', {
  text: 'edit',
  onClick: env => {
    editor.setValue(env.code)
  },
})
// http://prismjs.com/plugins/toolbar/
Prism.plugins.toolbar.registerButton('select', {
  text: 'select',
  onClick: env => {
    // http://stackoverflow.com/a/11128179/2757940
    if (document.body.createTextRange) {
      // Ms
      const range = document.body.createTextRange()
      range.moveToElementText(env.element)
      range.select()
    } else if (window.getSelection) {
      // Moz, opera, webkit
      const selection = window.getSelection()
      const range = document.createRange()
      range.selectNodeContents(env.element)
      selection.removeAllRanges()
      selection.addRange(range)
    }
  },
})

const {client} = xmpp()

const xconsole = new Console(client)
xconsole.resetInput = function() {
  editor.setValue('')
}
xconsole.log = function(subject, body) {
  const div = document.createElement('div')
  div.classList.add('log-entry')
  div.textContent = subject

  if (subject === '⮈ IN' || subject === '⮊ OUT' || body instanceof Error) {
    const pre = document.createElement('pre')
    pre.classList.add('language-xml')
    const code = document.createElement('code')
    code.textContent = body
    pre.appendChild(code)
    Prism.highlightElement(code)
    div.appendChild(pre)
  } else if (body) {
    div.textContent += body
  }

  const outputEl = document.getElementById('output')
  if (outputEl.firstChild) {
    outputEl.insertBefore(div, outputEl.firstChild)
  } else {
    outputEl.appendChild(div)
  }
}
xconsole.ask = function(options) {
  return new Promise((resolve, reject) => {
    options.submitCallback = resolve
    options.cancelCallback = reject
    notie.input(options)
  })
}
xconsole.choose = function(options) {
  return new Promise((resolve, reject) => {
    options.cancelCallback = reject
    options.choices = options.choices.map(choice => {
      return {
        text: choice,
        handler() {
          resolve(choice)
        },
      }
    })
    notie.select(options)
  })
}

function connect(params) {
  if (params.endpoint) {
    return client.connect(params.endpoint)
  }
  return xconsole
    .ask({
      text: 'Enter endpoint',
      value: 'ws://localhost:5280/xmpp-websocket',
      type: 'url',
    })
    .then(endpoint => {
      return client.connect(endpoint)
    })
}

fetch('/params')
  .then(res => {
    return res.json()
  })
  .then(
    params => {
      return connect(params)
    },
    () => {
      return connect({})
    }
  )

function send() {
  const xml = editor.getValue().trim()
  if (xml) {
    xconsole.send(xml)
  }
}

document.getElementById('input').addEventListener('submit', e => {
  e.preventDefault()
  send()
})

window.addEventListener('keydown', e => {
  if (e.defaultPrevented) {
    return
  }
  if (e.key === 'Enter' && e.ctrlKey) {
    e.preventDefault()
    send()
  }
})

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"../lib/Console":31,"./editor":32,"@xmpp/client":27}],34:[function(require,module,exports){
'use strict'

const timeout = require('./lib/timeout')
const delay = require('./lib/delay')
const TimeoutError = require('./lib/TimeoutError')
const promise = require('./lib/promise')
const _EventEmitter = require('./lib/EventEmitter')

exports = module.exports = class EventEmitter extends _EventEmitter {}
exports.EventEmitter = _EventEmitter
exports.timeout = timeout
exports.delay = delay
exports.TimeoutError = TimeoutError
exports.promise = promise

},{"./lib/EventEmitter":35,"./lib/TimeoutError":36,"./lib/delay":37,"./lib/promise":38,"./lib/timeout":39}],35:[function(require,module,exports){
'use strict'

const _EventEmitter = require('events')
const promiseEvent = require('./promise')

class EventEmitter {
  constructor() {
    this._emitter = new _EventEmitter()
    this._handlers = Object.create(null)
  }

  promise(...args) {
    return promiseEvent(this, ...args)
  }

  handle(event, handler) {
    this._handlers[event] = handler
  }

  delegate(event, ...args) {
    const handler = this._handlers[event]
    if (!handler) {
      throw new Error(`${event} has no handler attached.`)
    }
    const promise = handler(...args)
    if (!(promise instanceof Promise)) {
      throw new TypeError(`${event} handler must return a promise.`)
    }
    return promise
  }

  isHandled(event) {
    return Boolean(this._handlers[event])
  }
}

;[
  'on',
  'addListener',
  'removeListener',
  'once',
  'emit',
  'listenerCount',
].forEach(name => {
  EventEmitter.prototype[name] = function(...args) {
    this._emitter[name](...args)
  }
})

module.exports = EventEmitter

},{"./promise":38,"events":2}],36:[function(require,module,exports){
'use strict'

module.exports = class TimeoutError extends Error {
  constructor(message) {
    super(message)
    this.name = 'TimeoutError'
  }
}

},{}],37:[function(require,module,exports){
'use strict'

module.exports = function delay(timeout) {
  return new Promise(resolve => {
    setTimeout(resolve, timeout)
  })
}

},{}],38:[function(require,module,exports){
'use strict'

module.exports = function promise(EE, event, rejectEvent = 'error') {
  return new Promise((resolve, reject) => {
    const cleanup = () => {
      EE.removeListener(event, onEvent)
      EE.removeListener(rejectEvent, onError)
    }
    function onError(reason) {
      reject(reason)
      cleanup()
    }
    function onEvent(value) {
      resolve(value)
      cleanup()
    }
    EE.once(event, onEvent)
    if (rejectEvent) {
      EE.once(rejectEvent, onError)
    }
  })
}

},{}],39:[function(require,module,exports){
'use strict'

const TimeoutError = require('./TimeoutError')
const delay = require('./delay')

module.exports = function timeout(promise, ms) {
  return Promise.race([
    promise,
    delay(ms).then(() => {
      throw new TimeoutError()
    }),
  ])
}

},{"./TimeoutError":36,"./delay":37}],40:[function(require,module,exports){
'use strict'

module.exports = function id() {
  let i
  while (!i) {
    i = Math.random()
      .toString(36)
      .substr(2, 12)
  }
  return i
}

},{}],41:[function(require,module,exports){
'use strict'

const JID = require('./lib/JID')
const escaping = require('./lib/escaping')
const parse = require('./lib/parse')

function jid(...args) {
  if (!args[1] && !args[2]) {
    return parse(...args)
  }
  return new JID(...args)
}

exports = module.exports = jid.bind()
exports.jid = jid
exports.JID = JID
exports.equal = function(a, b) {
  return a.equals(b)
}
exports.detectEscape = escaping.detect
exports.escapeLocal = escaping.escape
exports.unescapeLocal = escaping.unescape
exports.parse = parse

},{"./lib/JID":42,"./lib/escaping":43,"./lib/parse":44}],42:[function(require,module,exports){
'use strict'

const escaping = require('./escaping')

/**
 * JID implements
 * - XMPP addresses according to RFC6122
 * - XEP-0106: JID Escaping
 *
 * @see http://tools.ietf.org/html/rfc6122#section-2
 * @see http://xmpp.org/extensions/xep-0106.html
 */
class JID {
  constructor(local, domain, resource) {
    if (typeof domain !== 'string' || !domain) {
      throw new TypeError(`Invalid domain.`)
    }
    this.setDomain(domain)
    this.setLocal(typeof local === 'string' ? local : '')
    this.setResource(typeof resource === 'string' ? resource : '')
  }

  [Symbol.toPrimitive](hint) {
    if (hint === 'number') {
      return NaN
    }
    return this.toString()
  }

  toString(unescape) {
    let s = this._domain
    if (this._local) {
      s = this.getLocal(unescape) + '@' + s
    }
    if (this._resource) {
      s = s + '/' + this._resource
    }
    return s
  }

  /**
   * Convenience method to distinguish users
   * */
  bare() {
    if (this._resource) {
      return new JID(this._local, this._domain, null)
    }
    return this
  }

  /**
     * Comparison function
     * */
  equals(other) {
    return (
      this._local === other._local &&
      this._domain === other._domain &&
      this._resource === other._resource
    )
  }

  /**
   * http://xmpp.org/rfcs/rfc6122.html#addressing-localpart
   * */
  setLocal(local, escape) {
    escape = escape || escaping.detect(local)

    if (escape) {
      local = escaping.escape(local)
    }

    this._local = local && local.toLowerCase()
    return this
  }

  getLocal(unescape) {
    unescape = unescape || false
    let local = null

    if (unescape) {
      local = escaping.unescape(this._local)
    } else {
      local = this._local
    }

    return local
  }

  /**
   * http://xmpp.org/rfcs/rfc6122.html#addressing-domain
   */
  setDomain(domain) {
    this._domain = domain.toLowerCase()
    return this
  }

  getDomain() {
    return this._domain
  }

  /**
   * http://xmpp.org/rfcs/rfc6122.html#addressing-resourcepart
   */
  setResource(resource) {
    this._resource = resource
    return this
  }

  getResource() {
    return this._resource
  }
}

Object.defineProperty(JID.prototype, 'local', {
  get: JID.prototype.getLocal,
  set: JID.prototype.setLocal,
})

Object.defineProperty(JID.prototype, 'domain', {
  get: JID.prototype.getDomain,
  set: JID.prototype.setDomain,
})

Object.defineProperty(JID.prototype, 'resource', {
  get: JID.prototype.getResource,
  set: JID.prototype.setResource,
})

module.exports = JID

},{"./escaping":43}],43:[function(require,module,exports){
'use strict'

module.exports.detect = function(local) {
  if (!local) {
    return false
  }

  // Remove all escaped sequences
  const tmp = local
    .replace(/\\20/g, '')
    .replace(/\\22/g, '')
    .replace(/\\26/g, '')
    .replace(/\\27/g, '')
    .replace(/\\2f/g, '')
    .replace(/\\3a/g, '')
    .replace(/\\3c/g, '')
    .replace(/\\3e/g, '')
    .replace(/\\40/g, '')
    .replace(/\\5c/g, '')

  // Detect if we have unescaped sequences
  const search = tmp.search(/\\| |"|&|'|\/|:|<|>|@/g)
  if (search === -1) {
    return false
  }
  return true
}

/**
 * Escape the local part of a JID.
 *
 * @see http://xmpp.org/extensions/xep-0106.html
 * @param String local local part of a jid
 * @return An escaped local part
 */
module.exports.escape = function(local) {
  if (local === null) {
    return null
  }

  return local
    .replace(/^\s+|\s+$/g, '')
    .replace(/\\/g, '\\5c')
    .replace(/ /g, '\\20')
    .replace(/"/g, '\\22')
    .replace(/&/g, '\\26')
    .replace(/'/g, '\\27')
    .replace(/\//g, '\\2f')
    .replace(/:/g, '\\3a')
    .replace(/</g, '\\3c')
    .replace(/>/g, '\\3e')
    .replace(/@/g, '\\40')
    .replace(/\3a/g, '\u0005c3a')
}

/**
 * Unescape a local part of a JID.
 *
 * @see http://xmpp.org/extensions/xep-0106.html
 * @param String local local part of a jid
 * @return unescaped local part
 */
module.exports.unescape = function(local) {
  if (local === null) {
    return null
  }

  return local
    .replace(/\\20/g, ' ')
    .replace(/\\22/g, '"')
    .replace(/\\26/g, '&')
    .replace(/\\27/g, "'")
    .replace(/\\2f/g, '/')
    .replace(/\\3a/g, ':')
    .replace(/\\3c/g, '<')
    .replace(/\\3e/g, '>')
    .replace(/\\40/g, '@')
    .replace(/\\5c/g, '\\')
}

},{}],44:[function(require,module,exports){
'use strict'

const JID = require('../lib/JID')

module.exports = function parse(s) {
  let local
  let resource

  const resourceStart = s.indexOf('/')
  if (resourceStart !== -1) {
    resource = s.substr(resourceStart + 1)
    s = s.substr(0, resourceStart)
  }

  const atStart = s.indexOf('@')
  if (atStart !== -1) {
    local = s.substr(0, atStart)
    s = s.substr(atStart + 1)
  }

  return new JID(local, s, resource)
}

},{"../lib/JID":42}],45:[function(require,module,exports){
'use strict'

const _Plugin = require('./lib/Plugin')
const jid = require('@xmpp/jid')
const xml = require('@xmpp/xml')

function plugin(name, props, dependencies = []) {
  class Plugin extends _Plugin {}
  Object.assign(Plugin.prototype, props)

  return {
    name,
    plugin(entity) {
      const p = new Plugin()
      p.attach(entity)

      const plugins = {}
      dependencies.forEach(dep => {
        plugins[dep.name] = entity.plugin(dep)
      })
      p.plugins = plugins

      return p
    },
    unplug() {
      // FIXME
    },
  }
}

module.exports = plugin.bind(undefined)
module.exports.plugin = plugin
module.exports.Plugin = _Plugin
module.exports.jid = jid
module.exports.xml = xml

},{"./lib/Plugin":46,"@xmpp/jid":41,"@xmpp/xml":64}],46:[function(require,module,exports){
'use strict'

const EventEmitter = require('@xmpp/events')

class Plugin extends EventEmitter {
  attach(entity) {
    this.entity = entity
  }

  detach() {
    delete this.entity
  }

  // Override
  start() {}

  stop() {}
}

module.exports = Plugin

},{"@xmpp/events":34}],47:[function(require,module,exports){
'use strict'

const {plugin, xml} = require('@xmpp/plugin')
const streamfeatures = require('../stream-features')
const iqCaller = require('../iq-caller')

/*
 * References
 * https://xmpp.org/rfcs/rfc6120.html#bind
 */

const NS = 'urn:ietf:params:xml:ns:xmpp-bind'

function makeBindElement(resource) {
  return xml('bind', {xmlns: NS}, resource && xml('resource', {}, resource))
}

function match(features) {
  return features.getChild('bind', NS)
}

module.exports = plugin(
  'bind',
  {
    start() {
      const streamFeature = {
        name: 'bind',
        priority: 2500,
        match,
        run: () => this.handleFeature(),
      }
      this.plugins['stream-features'].add(streamFeature)
    },
    bind(resource) {
      this.entity._status('binding')
      return this.plugins['iq-caller']
        .set(makeBindElement(resource))
        .then(result => {
          const jid = result.getChildText('jid')
          this.entity._jid(jid)
          this.entity._status('bound')
          return jid
        })
    },
    handleFeature() {
      const {entity} = this
      entity._status('bind')
      return entity.isHandled('bind')
        ? entity.delegate('bind', resource => this.bind(resource))
        : this.bind()
    },
  },
  [streamfeatures, iqCaller]
)

},{"../iq-caller":48,"../stream-features":55,"@xmpp/plugin":45}],48:[function(require,module,exports){
'use strict'

const {plugin, xml} = require('@xmpp/plugin')
const xid = require('@xmpp/id')

module.exports = plugin('iq-caller', {
  start() {
    this.handlers = new Map()
    this.handler = stanza => {
      if (!this.match(stanza)) {
        return
      }

      const {id} = stanza.attrs

      const handler = this.handlers.get(id)

      if (!handler) {
        return
      }

      if (stanza.attrs.type === 'error') {
        handler[1](stanza.getChild('error'))
      } else {
        handler[0](stanza.children[0])
      }
      this.handlers.delete(id)
    }
    this.entity.on('element', this.handler)
  },
  stop() {
    this.entity.removeListener('element', this.handler)
  },
  match(stanza) {
    return (
      stanza.name === 'iq' &&
      (stanza.attrs.type === 'error' || stanza.attrs.type === 'result')
    )
  },
  get(child, ...args) {
    return this.request(xml('iq', {type: 'get'}, child), ...args)
  },
  set(child, ...args) {
    return this.request(xml('iq', {type: 'set'}, child), ...args)
  },
  request(stanza, params) {
    if (typeof params === 'string') {
      params = {to: params}
    }

    const {to, id} = params || {}
    if (to) {
      stanza.attrs.to = to
    }

    if (id) {
      stanza.attrs.id = id
    } else if (!stanza.attrs.id) {
      stanza.attrs.id = xid()
    }

    return this.entity.send(stanza).then(() => {
      return new Promise((resolve, reject) =>
        this.handlers.set(stanza.attrs.id, [resolve, reject])
      )
    })
  },
})

},{"@xmpp/id":40,"@xmpp/plugin":45}],49:[function(require,module,exports){
'use strict'

const resolve = require('@xmpp/resolve')

function sc(socket, params) {
  return new Promise((resolve, reject) => {
    socket.once('error', reject)
    socket.connect(params, () => {
      socket.removeListener('error', reject)
      resolve()
    })
  })
}

function getURIs(domain) {
  return resolve(domain, {
    srv: [
      {
        service: 'xmpps-client',
        protocol: 'tcp',
      },
      {
        service: 'xmpp-client',
        protocol: 'tcp',
      },
    ],
  })
    .then(records => {
      return records.map(record => record.uri).filter(record => record)
    })
    .then(uris => [...new Set(uris)])
}

function fallbackConnect(entity, uris) {
  const uri = uris.shift()
  let params
  const Transport = entity.transports.find(Transport => {
    try {
      params = Transport.prototype.socketParameters(uri)
      return params !== undefined
    } catch (err) {
      return false
    }
  })

  if (!Transport) {
    throw new Error('No compatible connection method found.')
  }

  const socket = new Transport.prototype.Socket()
  const parser = new Transport.prototype.Parser()
  return sc(socket, params)
    .then(() => {
      entity._attachParser(parser)
      entity._attachSocket(socket)
      socket.emit('connect')
      entity.Transport = Transport
      entity.Socket = Transport.prototype.Socket
      entity.Parser = Transport.prototype.Parser
    })
    .catch(() => {
      if (uris.length === 0) {
        return new Error("Couldn't connect")
      }
      return fallbackConnect(entity, uris)
    })
}

module.exports.name = 'resolve'
module.exports.plugin = function plugin(entity) {
  const _connect = entity.connect
  entity.connect = function connect(domain) {
    if (domain.length === 0 || domain.match(/:\/\//)) {
      return _connect.call(this, domain)
    }
    return getURIs(domain).then(uris => {
      return fallbackConnect(entity, uris)
    })
  }

  return {
    entity,
  }
}

},{"@xmpp/resolve":57}],50:[function(require,module,exports){
'use strict'

const mech = require('sasl-anonymous')
const sasl = require('../sasl')

module.exports.name = 'sasl-anonymous'
module.exports.plugin = function plugin(entity) {
  const SASL = entity.plugin(sasl)
  SASL.use(mech)
  return {
    entity,
  }
}

},{"../sasl":52,"sasl-anonymous":20}],51:[function(require,module,exports){
'use strict'

const mech = require('sasl-plain')
const sasl = require('../sasl')

module.exports.name = 'sasl-plain'
module.exports.plugin = function plugin(entity) {
  const SASL = entity.plugin(sasl)
  SASL.use(mech)
  return {
    entity,
  }
}

},{"../sasl":52,"sasl-plain":22}],52:[function(require,module,exports){
'use strict'

const {encode, decode} = require('./lib/b64')
const plugin = require('@xmpp/plugin')
const xml = require('@xmpp/xml')
const streamFeatures = require('../stream-features')
const {XMPPError} = require('@xmpp/connection')
const SASLFactory = require('saslmechanisms')

const NS = 'urn:ietf:params:xml:ns:xmpp-sasl'

class SASLError extends XMPPError {
  constructor(...args) {
    super(...args)
    this.name = 'SASLError'
  }
}

function match(features) {
  return features.getChild('mechanisms', NS)
}

function getMechanismNames(features) {
  return features.getChild('mechanisms', NS).children.map(el => el.text())
}

module.exports = plugin(
  'sasl',
  {
    start() {
      this.SASL = new SASLFactory()
      this.streamFeature = {
        name: 'sasl',
        priority: 1000,
        match,
        restart: true,
        run: (entity, features) => {
          return this.gotFeatures(features)
        },
      }
      this.plugins['stream-features'].add(this.streamFeature)
    },

    stop() {
      delete this.SASL
      this.plugins['stream-features'].remove(this.streamFeature)
      delete this.streamFeature
      delete this.mech
    },

    use(...args) {
      this.SASL.use(...args)
    },

    gotFeatures(features) {
      const offered = getMechanismNames(features)
      const usable = this.getUsableMechanisms(offered)
      // FIXME const available = this.getAvailableMechanisms()

      return Promise.resolve(this.getMechanism(usable)).then(mech => {
        this.mech = mech
        return this.handleMechanism(mech, features)
      })
    },

    handleMechanism(mech, features) {
      this.entity._status('authenticate')

      if (mech === 'ANONYMOUS') {
        return this.authenticate(mech, {}, features)
      }

      return this.entity.delegate(
        'authenticate',
        (username, password) => {
          return this.authenticate(mech, {username, password}, features)
        },
        mech
      )
    },

    getAvailableMechanisms() {
      return this.SASL._mechs.map(({name}) => name)
    },

    getUsableMechanisms(mechs) {
      const supported = this.getAvailableMechanisms()
      return mechs.filter(mech => {
        return supported.indexOf(mech) > -1
      })
    },

    getMechanism(usable) {
      return usable[0] // FIXME prefer SHA-1, ... maybe order usable, available, ... by preferred?
    },

    findMechanism(name) {
      return this.SASL.create([name])
    },

    authenticate(mechname, credentials) {
      const mech = this.findMechanism(mechname)
      if (!mech) {
        return Promise.reject(new Error('no compatible mechanism'))
      }

      const {domain} = this.entity.options
      const creds = Object.assign(
        {
          username: null,
          password: null,
          server: domain,
          host: domain,
          realm: domain,
          serviceType: 'xmpp',
          serviceName: domain,
        },
        credentials
      )

      this.entity._status('authenticating')

      return new Promise((resolve, reject) => {
        const handler = element => {
          if (element.attrs.xmlns !== NS) {
            return
          }

          if (element.name === 'challenge') {
            mech.challenge(decode(element.text()))
            const resp = mech.response(creds)
            this.entity.send(
              xml(
                'response',
                {xmlns: NS, mechanism: mech.name},
                typeof resp === 'string' ? encode(resp) : ''
              )
            )
            return
          }

          if (element.name === 'failure') {
            reject(
              new SASLError(
                element.children[0].name,
                element.getChildText('text') || '',
                element
              )
            )
          } else if (element.name === 'success') {
            resolve()
            this.entity._status('authenticated')
          }

          this.entity.removeListener('nonza', handler)
        }
        this.entity.on('nonza', handler)

        if (mech.clientFirst) {
          this.entity.send(
            xml(
              'auth',
              {xmlns: NS, mechanism: mech.name},
              encode(mech.response(creds))
            )
          )
        }
      })
    },
  },
  [streamFeatures]
)

},{"../stream-features":55,"./lib/b64":53,"@xmpp/connection":30,"@xmpp/plugin":45,"@xmpp/xml":64,"saslmechanisms":24}],53:[function(require,module,exports){
(function (global,Buffer){
'use strict'

module.exports.encode = function encode(string) {
  if (!global.Buffer) {
    return global.btoa(string)
  }
  return Buffer.from(string, 'utf8').toString('base64')
}

module.exports.decode = function decode(string) {
  if (!global.Buffer) {
    return global.atob(string)
  }
  return Buffer.from(string, 'base64').toString('utf8')
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer)
},{"buffer":1}],54:[function(require,module,exports){
'use strict'

const {plugin, xml} = require('@xmpp/plugin')
const streamfeatures = require('../stream-features')
const iqCaller = require('../iq-caller')

const NS = 'urn:ietf:params:xml:ns:xmpp-session'

function match(features) {
  const feature = features.getChild('session', NS)
  return Boolean(feature) && !feature.getChild('optional')
}

module.exports = plugin(
  'session-establishment',
  {
    start() {
      const streamFeature = {
        name: 'session-establishment',
        priority: 2000,
        match,
        run: () => this.establishSession(),
      }
      this.plugins['stream-features'].add(streamFeature)
    },
    establishSession() {
      return this.entity.plugins['iq-caller'].set(
        xml('session', 'urn:ietf:params:xml:ns:xmpp-session')
      )
    },
  },
  [streamfeatures, iqCaller]
)
module.exports.match = match

},{"../iq-caller":48,"../stream-features":55,"@xmpp/plugin":45}],55:[function(require,module,exports){
'use strict'

/**
 * References
 * https://xmpp.org/rfcs/rfc6120.html#streams-negotiation Stream Negotiation
 * https://xmpp.org/extensions/xep-0170.html XEP-0170: Recommended Order of Stream Feature Negotiation
 * https://xmpp.org/registrar/stream-features.html XML Stream Features
 */

const plugin = require('@xmpp/plugin')

module.exports = plugin('stream-features', {
  start() {
    this.features = []

    const {entity} = this
    this.handler = el => {
      if (el.name !== 'stream:features') {
        return
      }

      const streamFeatures = this.selectFeatures(el)
      if (streamFeatures.length === 0) {
        return
      }

      function iterate(c) {
        const feature = streamFeatures[c]
        return feature
          .run(entity, el)
          .then(() => {
            if (feature.restart) {
              return entity.restart()
            }
            if (c === streamFeatures.length - 1) {
              if (entity.jid) entity._status('online', entity.jid)
            } else {
              iterate(c + 1)
            }
          })
          .catch(err => entity.emit('error', err))
      }

      return iterate(0)
    }

    entity.on('nonza', this.handler)
  },

  stop() {
    delete this.features
    this.entity.off('nonza', this.handler)
    delete this.handler
  },

  selectFeatures(el) {
    return this.features
      .filter(f => f.match(el, this.entity) && typeof f.priority === 'number')
      .sort((a, b) => {
        return a.priority < b.priority
      })
  },

  add({name, priority, run, match, restart}) {
    this.features.push({name, priority, run, match, restart})
  },
})

},{"@xmpp/plugin":45}],56:[function(require,module,exports){
'use strict'

const EventEmitter = require('@xmpp/events/lib/EventEmitter')

class Reconnect extends EventEmitter {
  constructor(entity) {
    super()

    this.delay = 1000
    this.entity = entity
  }

  reconnect() {
    const {entity, delay} = this
    this.emit('reconnecting')
    this._timeout = setTimeout(() => {
      if (entity.status === 'offline') {
        return
      }
      // Allow calling start() even though status is not offline
      // reset status property right after
      const {status} = entity
      entity.status = 'offline'

      entity
        .start(entity.startOptions)
        .then(() => {
          this.emit('reconnected')
        })
        .catch(() => this.reconnect())
        .catch(err => {
          this.emit('error', err)
        })
      entity.status = status
    }, delay)
  }

  start() {
    const {entity} = this
    const listeners = {}
    listeners.disconnect = () => {
      this.reconnect()
    }
    listeners.online = () => {
      entity.on('disconnect', listeners.disconnect)
    }
    this.listeners = listeners
    entity.once('online', listeners.online)
  }

  stop() {
    const {entity} = this
    const {listeners, _timeout} = this
    entity.removeListener('disconnect', listeners.disconnect)
    clearTimeout(_timeout)
    entity.removeListener('online', this.listeners.online)
  }
}

module.exports = function reconnect(entity) {
  const r = new Reconnect(entity)
  r.start()
  return r
}

},{"@xmpp/events/lib/EventEmitter":35}],57:[function(require,module,exports){
'use strict'

const dns = require('./lib/dns')
const http = require('./lib/http')

module.exports = function resolve(...args) {
  return Promise.all([
    dns.resolve ? dns.resolve(...args) : Promise.resolve([]),
    http.resolve(...args),
  ]).then(([records, endpoints]) => records.concat(endpoints))
}

if (dns.resolve) {
  module.exports.dns = dns
}
module.exports.http = http

},{"./lib/dns":1,"./lib/http":59}],58:[function(require,module,exports){
'use strict'

function isSecure(uri) {
  return uri.startsWith('https') || uri.startsWith('wss')
}

module.exports.compare = function compare(a, b) {
  let secure
  if (isSecure(a.uri) && !isSecure(b.uri)) {
    secure = -1
  } else if (!isSecure(a.uri) && isSecure(b.uri)) {
    secure = 1
  } else {
    secure = 0
  }
  if (secure !== 0) {
    return secure
  }

  let method
  if (a.method === b.method) {
    method = 0
  } else if (a.method === 'websocket') {
    method = -1
  } else if (b.method === 'websocket') {
    method = 1
  } else if (a.method === 'xbosh') {
    method = -1
  } else if (b.method === 'xbosh') {
    method = 1
  } else if (a.method === 'httppoll') {
    method = -1
  } else if (b.method === 'httppoll') {
    method = 1
  } else {
    method = 0
  }
  if (method !== 0) {
    return method
  }

  return 0
}

},{}],59:[function(require,module,exports){
(function (global){
'use strict'

const fetch = global.fetch || require('node-fetch')
const parse = require('@xmpp/xml/lib/parse')
const compareAltConnections = require('./alt-connections').compare

function resolve(domain) {
  return fetch(`https://${domain}/.well-known/host-meta`)
    .then(res => res.text())
    .then(res => {
      return parse(res)
        .getChildren('Link')
        .filter(
          link =>
            [
              'urn:xmpp:alt-connections:websocket',
              'urn:xmpp:alt-connections:httppoll',
              'urn:xmpp:alt-connections:xbosh',
            ].indexOf(link.attrs.rel) > -1
        )
        .map(({attrs}) => ({
          rel: attrs.rel,
          href: attrs.href,
          method: attrs.rel.split(':').pop(),
          uri: attrs.href,
        }))
        .sort(compareAltConnections)
    })
    .catch(() => {
      return []
    })
}

module.exports.resolve = resolve

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./alt-connections":58,"@xmpp/xml/lib/parse":67,"node-fetch":1}],60:[function(require,module,exports){
'use strict'

const ConnectionWebSocket = require('./lib/Connection')

module.exports = function websocket(entity) {
  entity.transports.push(ConnectionWebSocket)
}

},{"./lib/Connection":61}],61:[function(require,module,exports){
'use strict'

const Socket = require('./Socket')
const Connection = require('@xmpp/connection')
const xml = require('@xmpp/xml')
const FramedParser = require('./FramedParser')

const NS_FRAMING = 'urn:ietf:params:xml:ns:xmpp-framing'

/* References
 * WebSocket protocol https://tools.ietf.org/html/rfc6455
 * WebSocket Web API https://html.spec.whatwg.org/multipage/comms.html#network
 * XMPP over WebSocket https://tools.ietf.org/html/rfc7395
*/

class ConnectionWebSocket extends Connection {
  // https://tools.ietf.org/html/rfc7395#section-3.6
  footerElement() {
    return new xml.Element('close', {
      xmlns: NS_FRAMING,
    })
  }

  // https://tools.ietf.org/html/rfc7395#section-3.4
  headerElement() {
    const el = super.headerElement()
    el.name = 'open'
    el.attrs.xmlns = NS_FRAMING
    return el
  }

  socketParameters(uri) {
    return uri.match(/^wss?:\/\//) ? uri : undefined
  }
}

ConnectionWebSocket.prototype.Socket = Socket
ConnectionWebSocket.prototype.NS = 'jabber:client'
ConnectionWebSocket.prototype.Parser = FramedParser

module.exports = ConnectionWebSocket

},{"./FramedParser":62,"./Socket":63,"@xmpp/connection":30,"@xmpp/xml":64}],62:[function(require,module,exports){
'use strict'

const {Parser} = require('@xmpp/xml')

module.exports = class FramedParser extends Parser {
  onStartElement() {}

  onEndElement(element, length) {
    if (length === 1) {
      if (element.is('open', 'urn:ietf:params:xml:ns:xmpp-framing')) {
        this.emit('start', element)
      } else if (element.is('close', 'urn:ietf:params:xml:ns:xmpp-framing')) {
        this.emit('end', element)
      } else {
        this.emit('element', element)
      }
    }
  }
}

},{"@xmpp/xml":64}],63:[function(require,module,exports){
(function (global){
'use strict'

const WS = require('ws')
const WebSocket = global.WebSocket || WS
const EventEmitter = require('events')

class Socket extends EventEmitter {
  constructor() {
    super()
    this.listeners = Object.create(null)
  }

  connect(url, fn) {
    this.url = url
    this._attachSocket(new WebSocket(url, ['xmpp']), fn)
  }

  _attachSocket(socket, fn) {
    const sock = (this.socket = socket)
    const {listeners} = this
    listeners.open = () => {
      this.emit('connect')
      if (fn) {
        fn()
      }
    }
    listeners.message = ({data}) => this.emit('data', data)
    listeners.error = err => {
      this.emit(
        'error',
        err instanceof Error ? err : new Error(`connection error ${this.url}`)
      )
    }
    listeners.close = ({code, reason}) => {
      this._detachSocket()
      this.emit('close', {code, reason})
    }

    sock.addEventListener('open', listeners.open)
    sock.addEventListener('message', listeners.message)
    sock.addEventListener('error', listeners.error)
    sock.addEventListener('close', listeners.close)
  }

  _detachSocket() {
    delete this.url
    const {socket, listeners} = this
    Object.getOwnPropertyNames(listeners).forEach(k => {
      socket.removeEventListener(k, listeners[k])
      delete listeners[k]
    })
    delete this.socket
  }

  end() {
    this.socket.close()
  }

  write(data, fn) {
    if (WebSocket === WS) {
      this.socket.send(data, fn)
    } else {
      this.socket.send(data)
      fn()
    }
  }
}

module.exports = Socket

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"events":2,"ws":1}],64:[function(require,module,exports){
'use strict'

const x = require('./lib/x')
const Element = require('./lib/Element')
const Parser = require('./lib/Parser')
const {
  escapeXML,
  unescapeXML,
  escapeXMLText,
  unescapeXMLText,
} = require('ltx/lib/escape')

function xml(...args) {
  return x(...args)
}

exports = module.exports = xml

Object.assign(exports, {
  x,
  Element,
  Parser,
  escapeXML,
  unescapeXML,
  escapeXMLText,
  unescapeXMLText,
})

},{"./lib/Element":65,"./lib/Parser":66,"./lib/x":68,"ltx/lib/escape":10}],65:[function(require,module,exports){
'use strict'

const _Element = require('ltx/lib/Element')

class Element extends _Element {
  setAttrs(attrs) {
    if (typeof attrs === 'string') {
      this.attrs.xmlns = attrs
    } else if (attrs) {
      Object.keys(attrs).forEach(function(key) {
        const val = attrs[key]
        if (val !== undefined && val !== null)
          this.attrs[key.toString()] = val.toString()
      }, this)
    }
  }

  append(nodes) {
    nodes = Array.isArray(nodes) ? nodes : [nodes]
    nodes.forEach(node => {
      this.children.push(node)
      if (typeof node === 'object') {
        node.parent = this
      }
    })
    return this
  }

  prepend(nodes) {
    nodes = Array.isArray(nodes) ? nodes : [nodes]
    nodes.forEach(node => {
      this.children.unshift(node)
      if (typeof node === 'object') {
        node.parent = this
      }
    })
    return this
  }
}

module.exports = Element

},{"ltx/lib/Element":5}],66:[function(require,module,exports){
'use strict'

const LtxParser = require('ltx/lib/parsers/ltx')
const Element = require('./Element')
const EventEmitter = require('events')

class XMLError extends Error {
  constructor(...args) {
    super(...args)
    this.name = 'XMLError'
  }
}

class Parser extends EventEmitter {
  constructor() {
    super()
    const parser = new LtxParser()
    const stack = []
    let cursor

    parser.on('startElement', (name, attrs) => {
      const child = new Element(name, attrs)
      if (cursor) {
        cursor.append(child)
      }
      this.onStartElement(child, cursor)
      this.emit('startElement', child)
      stack.push(cursor)
      cursor = child
    })
    parser.on('endElement', name => {
      if (name === cursor.name) {
        this.onEndElement(cursor, stack.length)
        this.emit('endElement', cursor)
        cursor = stack.pop()
      } else {
        // <foo></bar>
        this.emit('error', new XMLError(`${cursor.name} must be closed.`))
      }
    })

    parser.on('text', str => {
      this.onText(str, cursor)
    })
    this.parser = parser
  }

  onStartElement(element, cursor) {
    if (!cursor) {
      this.emit('start', element)
    }
  }

  onEndElement(element, length) {
    if (length === 2) {
      this.emit('element', element)
    } else if (length === 1) {
      this.emit('end', element)
    }
  }

  onText(str, element) {
    if (!element) {
      this.emit('error', new XMLError(`${str} must be a child.`))
      return
    }
    element.t(str)
  }

  write(data) {
    this.parser.write(data)
  }

  end(data) {
    if (data) {
      this.parser.write(data)
    }
  }
}

Parser.XMLError = XMLError

module.exports = Parser

},{"./Element":65,"events":2,"ltx/lib/parsers/ltx":13}],67:[function(require,module,exports){
'use strict'

const Parser = require('./Parser')

module.exports = function parse(data) {
  const p = new Parser()

  let result = null
  let error = null

  p.on('end', tree => {
    result = tree
  })
  p.on('error', err => {
    error = err
  })

  p.write(data)
  p.end()

  if (error) {
    throw error
  } else {
    return result
  }
}

},{"./Parser":66}],68:[function(require,module,exports){
'use strict'

const Element = require('./Element')

function append(el, child) {
  if (child instanceof Element) {
    el.append(child)
  } else if (Array.isArray(child)) {
    child.forEach(c => append(el, c))
  } else if (child !== null && child !== undefined) {
    el.append(String(child))
  }
}

function x(name, attrs, ...children) {
  const el = new Element(name, attrs)
  for (let i = 0; i < children.length; i++) {
    append(el, children[i])
  }
  return el
}

module.exports = x

},{"./Element":65}]},{},[33]);
