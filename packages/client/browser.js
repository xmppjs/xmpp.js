(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('bufferutil'), require('utf-8-validate')) :
  typeof define === 'function' && define.amd ? define(['exports', 'bufferutil', 'utf-8-validate'], factory) :
  (global = global || self, factory(global['@xmpp/client'] = {}, global.bufferutil, global.utf8Validate));
}(this, function (exports, bufferutil, utf8Validate) { 'use strict';

  bufferutil = bufferutil && bufferutil.hasOwnProperty('default') ? bufferutil['default'] : bufferutil;
  utf8Validate = utf8Validate && utf8Validate.hasOwnProperty('default') ? utf8Validate['default'] : utf8Validate;

  var TimeoutError_1 = class TimeoutError extends Error {
    constructor(message) {
      super(message);
      this.name = 'TimeoutError';
    }

  };

  var delay = function delay(ms) {
    let timeout;
    const promise = new Promise(resolve => {
      timeout = setTimeout(resolve, ms);
    });
    promise.timeout = timeout;
    return promise;
  };

  var timeout = function timeout(promise, ms) {
    const promiseDelay = delay(ms);

    function cancelDelay() {
      clearTimeout(promiseDelay.timeout);
    }

    return Promise.race([promise.finally(cancelDelay), promiseDelay.then(() => {
      throw new TimeoutError_1();
    })]);
  };

  var promise = function promise(EE, event, rejectEvent = 'error', timeout) {
    return new Promise((resolve, reject) => {
      let timeoutId;

      const cleanup = () => {
        clearTimeout(timeoutId);
        EE.removeListener(event, onEvent);
        EE.removeListener(rejectEvent, onError);
      };

      function onError(reason) {
        reject(reason);
        cleanup();
      }

      function onEvent(value) {
        resolve(value);
        cleanup();
      }

      EE.once(event, onEvent);

      if (rejectEvent) {
        EE.once(rejectEvent, onError);
      }

      if (timeout) {
        timeoutId = setTimeout(() => {
          cleanup();
          reject(new TimeoutError_1());
        }, timeout);
      }
    });
  };

  var domain; // This constructor is used to store event handlers. Instantiating this is
  // faster than explicitly calling `Object.create(null)` to get a "clean" empty
  // object (tested with v8 v4.9).

  function EventHandlers() {}

  EventHandlers.prototype = Object.create(null);

  function EventEmitter() {
    EventEmitter.init.call(this);
  }
  // require('events') === require('events').EventEmitter

  EventEmitter.EventEmitter = EventEmitter;
  EventEmitter.usingDomains = false;
  EventEmitter.prototype.domain = undefined;
  EventEmitter.prototype._events = undefined;
  EventEmitter.prototype._maxListeners = undefined; // By default EventEmitters will print a warning if more than 10 listeners are
  // added to it. This is a useful default which helps finding memory leaks.

  EventEmitter.defaultMaxListeners = 10;

  EventEmitter.init = function () {
    this.domain = null;

    if (EventEmitter.usingDomains) {
      // if there is an active domain, then attach to it.
      if (domain.active && !(this instanceof domain.Domain)) ;
    }

    if (!this._events || this._events === Object.getPrototypeOf(this)._events) {
      this._events = new EventHandlers();
      this._eventsCount = 0;
    }

    this._maxListeners = this._maxListeners || undefined;
  }; // Obviously not all Emitters should be limited to 10. This function allows
  // that to be increased. Set to zero for unlimited.


  EventEmitter.prototype.setMaxListeners = function setMaxListeners(n) {
    if (typeof n !== 'number' || n < 0 || isNaN(n)) throw new TypeError('"n" argument must be a positive number');
    this._maxListeners = n;
    return this;
  };

  function $getMaxListeners(that) {
    if (that._maxListeners === undefined) return EventEmitter.defaultMaxListeners;
    return that._maxListeners;
  }

  EventEmitter.prototype.getMaxListeners = function getMaxListeners() {
    return $getMaxListeners(this);
  }; // These standalone emit* functions are used to optimize calling of event
  // handlers for fast cases because emit() itself often has a variable number of
  // arguments and can be deoptimized because of that. These functions always have
  // the same number of arguments and thus do not get deoptimized, so the code
  // inside them can execute faster.


  function emitNone(handler, isFn, self) {
    if (isFn) handler.call(self);else {
      var len = handler.length;
      var listeners = arrayClone(handler, len);

      for (var i = 0; i < len; ++i) listeners[i].call(self);
    }
  }

  function emitOne(handler, isFn, self, arg1) {
    if (isFn) handler.call(self, arg1);else {
      var len = handler.length;
      var listeners = arrayClone(handler, len);

      for (var i = 0; i < len; ++i) listeners[i].call(self, arg1);
    }
  }

  function emitTwo(handler, isFn, self, arg1, arg2) {
    if (isFn) handler.call(self, arg1, arg2);else {
      var len = handler.length;
      var listeners = arrayClone(handler, len);

      for (var i = 0; i < len; ++i) listeners[i].call(self, arg1, arg2);
    }
  }

  function emitThree(handler, isFn, self, arg1, arg2, arg3) {
    if (isFn) handler.call(self, arg1, arg2, arg3);else {
      var len = handler.length;
      var listeners = arrayClone(handler, len);

      for (var i = 0; i < len; ++i) listeners[i].call(self, arg1, arg2, arg3);
    }
  }

  function emitMany(handler, isFn, self, args) {
    if (isFn) handler.apply(self, args);else {
      var len = handler.length;
      var listeners = arrayClone(handler, len);

      for (var i = 0; i < len; ++i) listeners[i].apply(self, args);
    }
  }

  EventEmitter.prototype.emit = function emit(type) {
    var er, handler, len, args, i, events, domain;
    var doError = type === 'error';
    events = this._events;
    if (events) doError = doError && events.error == null;else if (!doError) return false;
    domain = this.domain; // If there is no 'error' event listener then throw.

    if (doError) {
      er = arguments[1];

      if (domain) {
        if (!er) er = new Error('Uncaught, unspecified "error" event');
        er.domainEmitter = this;
        er.domain = domain;
        er.domainThrown = false;
        domain.emit('error', er);
      } else if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      } else {
        // At least give some kind of context to the user
        var err = new Error('Uncaught, unspecified "error" event. (' + er + ')');
        err.context = er;
        throw err;
      }

      return false;
    }

    handler = events[type];
    if (!handler) return false;
    var isFn = typeof handler === 'function';
    len = arguments.length;

    switch (len) {
      // fast cases
      case 1:
        emitNone(handler, isFn, this);
        break;

      case 2:
        emitOne(handler, isFn, this, arguments[1]);
        break;

      case 3:
        emitTwo(handler, isFn, this, arguments[1], arguments[2]);
        break;

      case 4:
        emitThree(handler, isFn, this, arguments[1], arguments[2], arguments[3]);
        break;
      // slower

      default:
        args = new Array(len - 1);

        for (i = 1; i < len; i++) args[i - 1] = arguments[i];

        emitMany(handler, isFn, this, args);
    }
    return true;
  };

  function _addListener(target, type, listener, prepend) {
    var m;
    var events;
    var existing;
    if (typeof listener !== 'function') throw new TypeError('"listener" argument must be a function');
    events = target._events;

    if (!events) {
      events = target._events = new EventHandlers();
      target._eventsCount = 0;
    } else {
      // To avoid recursion in the case that type === "newListener"! Before
      // adding it to the listeners, first emit "newListener".
      if (events.newListener) {
        target.emit('newListener', type, listener.listener ? listener.listener : listener); // Re-assign `events` because a newListener handler could have caused the
        // this._events to be assigned to a new object

        events = target._events;
      }

      existing = events[type];
    }

    if (!existing) {
      // Optimize the case of one listener. Don't need the extra array object.
      existing = events[type] = listener;
      ++target._eventsCount;
    } else {
      if (typeof existing === 'function') {
        // Adding the second element, need to change to array.
        existing = events[type] = prepend ? [listener, existing] : [existing, listener];
      } else {
        // If we've already got an array, just append.
        if (prepend) {
          existing.unshift(listener);
        } else {
          existing.push(listener);
        }
      } // Check for listener leak


      if (!existing.warned) {
        m = $getMaxListeners(target);

        if (m && m > 0 && existing.length > m) {
          existing.warned = true;
          var w = new Error('Possible EventEmitter memory leak detected. ' + existing.length + ' ' + type + ' listeners added. ' + 'Use emitter.setMaxListeners() to increase limit');
          w.name = 'MaxListenersExceededWarning';
          w.emitter = target;
          w.type = type;
          w.count = existing.length;
          emitWarning(w);
        }
      }
    }

    return target;
  }

  function emitWarning(e) {
    typeof console.warn === 'function' ? console.warn(e) : console.log(e);
  }

  EventEmitter.prototype.addListener = function addListener(type, listener) {
    return _addListener(this, type, listener, false);
  };

  EventEmitter.prototype.on = EventEmitter.prototype.addListener;

  EventEmitter.prototype.prependListener = function prependListener(type, listener) {
    return _addListener(this, type, listener, true);
  };

  function _onceWrap(target, type, listener) {
    var fired = false;

    function g() {
      target.removeListener(type, g);

      if (!fired) {
        fired = true;
        listener.apply(target, arguments);
      }
    }

    g.listener = listener;
    return g;
  }

  EventEmitter.prototype.once = function once(type, listener) {
    if (typeof listener !== 'function') throw new TypeError('"listener" argument must be a function');
    this.on(type, _onceWrap(this, type, listener));
    return this;
  };

  EventEmitter.prototype.prependOnceListener = function prependOnceListener(type, listener) {
    if (typeof listener !== 'function') throw new TypeError('"listener" argument must be a function');
    this.prependListener(type, _onceWrap(this, type, listener));
    return this;
  }; // emits a 'removeListener' event iff the listener was removed


  EventEmitter.prototype.removeListener = function removeListener(type, listener) {
    var list, events, position, i, originalListener;
    if (typeof listener !== 'function') throw new TypeError('"listener" argument must be a function');
    events = this._events;
    if (!events) return this;
    list = events[type];
    if (!list) return this;

    if (list === listener || list.listener && list.listener === listener) {
      if (--this._eventsCount === 0) this._events = new EventHandlers();else {
        delete events[type];
        if (events.removeListener) this.emit('removeListener', type, list.listener || listener);
      }
    } else if (typeof list !== 'function') {
      position = -1;

      for (i = list.length; i-- > 0;) {
        if (list[i] === listener || list[i].listener && list[i].listener === listener) {
          originalListener = list[i].listener;
          position = i;
          break;
        }
      }

      if (position < 0) return this;

      if (list.length === 1) {
        list[0] = undefined;

        if (--this._eventsCount === 0) {
          this._events = new EventHandlers();
          return this;
        } else {
          delete events[type];
        }
      } else {
        spliceOne(list, position);
      }

      if (events.removeListener) this.emit('removeListener', type, originalListener || listener);
    }

    return this;
  };

  EventEmitter.prototype.removeAllListeners = function removeAllListeners(type) {
    var listeners, events;
    events = this._events;
    if (!events) return this; // not listening for removeListener, no need to emit

    if (!events.removeListener) {
      if (arguments.length === 0) {
        this._events = new EventHandlers();
        this._eventsCount = 0;
      } else if (events[type]) {
        if (--this._eventsCount === 0) this._events = new EventHandlers();else delete events[type];
      }

      return this;
    } // emit removeListener for all listeners on all events


    if (arguments.length === 0) {
      var keys = Object.keys(events);

      for (var i = 0, key; i < keys.length; ++i) {
        key = keys[i];
        if (key === 'removeListener') continue;
        this.removeAllListeners(key);
      }

      this.removeAllListeners('removeListener');
      this._events = new EventHandlers();
      this._eventsCount = 0;
      return this;
    }

    listeners = events[type];

    if (typeof listeners === 'function') {
      this.removeListener(type, listeners);
    } else if (listeners) {
      // LIFO order
      do {
        this.removeListener(type, listeners[listeners.length - 1]);
      } while (listeners[0]);
    }

    return this;
  };

  EventEmitter.prototype.listeners = function listeners(type) {
    var evlistener;
    var ret;
    var events = this._events;
    if (!events) ret = [];else {
      evlistener = events[type];
      if (!evlistener) ret = [];else if (typeof evlistener === 'function') ret = [evlistener.listener || evlistener];else ret = unwrapListeners(evlistener);
    }
    return ret;
  };

  EventEmitter.listenerCount = function (emitter, type) {
    if (typeof emitter.listenerCount === 'function') {
      return emitter.listenerCount(type);
    } else {
      return listenerCount.call(emitter, type);
    }
  };

  EventEmitter.prototype.listenerCount = listenerCount;

  function listenerCount(type) {
    var events = this._events;

    if (events) {
      var evlistener = events[type];

      if (typeof evlistener === 'function') {
        return 1;
      } else if (evlistener) {
        return evlistener.length;
      }
    }

    return 0;
  }

  EventEmitter.prototype.eventNames = function eventNames() {
    return this._eventsCount > 0 ? Reflect.ownKeys(this._events) : [];
  }; // About 1.5x faster than the two-arg version of Array#splice().


  function spliceOne(list, index) {
    for (var i = index, k = i + 1, n = list.length; k < n; i += 1, k += 1) list[i] = list[k];

    list.pop();
  }

  function arrayClone(arr, i) {
    var copy = new Array(i);

    while (i--) copy[i] = arr[i];

    return copy;
  }

  function unwrapListeners(arr) {
    var ret = new Array(arr.length);

    for (var i = 0; i < ret.length; ++i) {
      ret[i] = arr[i].listener || arr[i];
    }

    return ret;
  }

  var Deferred = function Deferred() {
    this.promise = new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });
  };

  var EventEmitter_1 = EventEmitter;
  var timeout_1 = timeout;
  var delay_1 = delay;
  var TimeoutError_1$1 = TimeoutError_1;
  var promise_1 = promise;
  var Deferred_1 = Deferred;
  var esm = {
    EventEmitter: EventEmitter_1,
    timeout: timeout_1,
    delay: delay_1,
    TimeoutError: TimeoutError_1$1,
    promise: promise_1,
    Deferred: Deferred_1
  };

  var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

  function createCommonjsModule(fn, module) {
  	return module = { exports: {} }, fn(module, module.exports), module.exports;
  }

  function getCjsExportFromNamespace (n) {
  	return n && n['default'] || n;
  }

  var detect = function (local) {
    if (!local) {
      return false;
    } // Remove all escaped sequences


    const tmp = local.replace(/\\20/g, '').replace(/\\22/g, '').replace(/\\26/g, '').replace(/\\27/g, '').replace(/\\2f/g, '').replace(/\\3a/g, '').replace(/\\3c/g, '').replace(/\\3e/g, '').replace(/\\40/g, '').replace(/\\5c/g, ''); // Detect if we have unescaped sequences

    const search = tmp.search(/\\| |"|&|'|\/|:|<|>|@/g);

    if (search === -1) {
      return false;
    }

    return true;
  };
  /**
   * Escape the local part of a JID.
   *
   * @see http://xmpp.org/extensions/xep-0106.html
   * @param String local local part of a jid
   * @return An escaped local part
   */


  var escape$1 = function (local) {
    if (local === null) {
      return null;
    }

    return local.replace(/^\s+|\s+$/g, '').replace(/\\/g, '\\5c').replace(/ /g, '\\20').replace(/"/g, '\\22').replace(/&/g, '\\26').replace(/'/g, '\\27').replace(/\//g, '\\2f').replace(/:/g, '\\3a').replace(/</g, '\\3c').replace(/>/g, '\\3e').replace(/@/g, '\\40').replace(/\3a/g, '\u0005c3a');
  };
  /**
   * Unescape a local part of a JID.
   *
   * @see http://xmpp.org/extensions/xep-0106.html
   * @param String local local part of a jid
   * @return unescaped local part
   */


  var unescape = function (local) {
    if (local === null) {
      return null;
    }

    return local.replace(/\\20/g, ' ').replace(/\\22/g, '"').replace(/\\26/g, '&').replace(/\\27/g, "'").replace(/\\2f/g, '/').replace(/\\3a/g, ':').replace(/\\3c/g, '<').replace(/\\3e/g, '>').replace(/\\40/g, '@').replace(/\\5c/g, '\\');
  };

  var escaping = {
    detect: detect,
    escape: escape$1,
    unescape: unescape
  };

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
        throw new TypeError(`Invalid domain.`);
      }

      this.setDomain(domain);
      this.setLocal(typeof local === 'string' ? local : '');
      this.setResource(typeof resource === 'string' ? resource : '');
    }

    [Symbol.toPrimitive](hint) {
      if (hint === 'number') {
        return NaN;
      }

      return this.toString();
    }

    toString(unescape) {
      let s = this._domain;

      if (this._local) {
        s = this.getLocal(unescape) + '@' + s;
      }

      if (this._resource) {
        s = s + '/' + this._resource;
      }

      return s;
    }
    /**
     * Convenience method to distinguish users
     * */


    bare() {
      if (this._resource) {
        return new JID(this._local, this._domain, null);
      }

      return this;
    }
    /**
     * Comparison function
     * */


    equals(other) {
      return this._local === other._local && this._domain === other._domain && this._resource === other._resource;
    }
    /**
     * http://xmpp.org/rfcs/rfc6122.html#addressing-localpart
     * */


    setLocal(local, escape) {
      escape = escape || escaping.detect(local);

      if (escape) {
        local = escaping.escape(local);
      }

      this._local = local && local.toLowerCase();
      return this;
    }

    getLocal(unescape) {
      unescape = unescape || false;
      let local = null;

      if (unescape) {
        local = escaping.unescape(this._local);
      } else {
        local = this._local;
      }

      return local;
    }
    /**
     * http://xmpp.org/rfcs/rfc6122.html#addressing-domain
     */


    setDomain(domain) {
      this._domain = domain.toLowerCase();
      return this;
    }

    getDomain() {
      return this._domain;
    }
    /**
     * http://xmpp.org/rfcs/rfc6122.html#addressing-resourcepart
     */


    setResource(resource) {
      this._resource = resource;
      return this;
    }

    getResource() {
      return this._resource;
    }

  }

  Object.defineProperty(JID.prototype, 'local', {
    get: JID.prototype.getLocal,
    set: JID.prototype.setLocal
  });
  Object.defineProperty(JID.prototype, 'domain', {
    get: JID.prototype.getDomain,
    set: JID.prototype.setDomain
  });
  Object.defineProperty(JID.prototype, 'resource', {
    get: JID.prototype.getResource,
    set: JID.prototype.setResource
  });
  var JID_1 = JID;

  var parse = function parse(s) {
    let local;
    let resource;
    const resourceStart = s.indexOf('/');

    if (resourceStart !== -1) {
      resource = s.substr(resourceStart + 1);
      s = s.substr(0, resourceStart);
    }

    const atStart = s.indexOf('@');

    if (atStart !== -1) {
      local = s.substr(0, atStart);
      s = s.substr(atStart + 1);
    }

    return new JID_1(local, s, resource);
  };

  var esm$1 = createCommonjsModule(function (module, exports) {
    function jid(...args) {
      if (!args[1] && !args[2]) {
        return parse(...args);
      }

      return new JID_1(...args);
    } // eslint-disable-next-line no-global-assign


    exports = module.exports = jid.bind();
    exports.jid = jid;
    exports.JID = JID_1;

    exports.equal = function (a, b) {
      return a.equals(b);
    };

    exports.detectEscape = escaping.detect;
    exports.escapeLocal = escaping.escape;
    exports.unescapeLocal = escaping.unescape;
    exports.parse = parse;
  });
  var esm_1 = esm$1.jid;
  var esm_2 = esm$1.JID;
  var esm_3 = esm$1.equal;
  var esm_4 = esm$1.detectEscape;
  var esm_5 = esm$1.escapeLocal;
  var esm_6 = esm$1.unescapeLocal;
  var esm_7 = esm$1.parse;

  var escapeXMLTable = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    '\'': '&apos;'
  };

  function escapeXMLReplace(match) {
    return escapeXMLTable[match];
  }

  var unescapeXMLTable = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&apos;': "'"
  };

  function unescapeXMLReplace(match) {
    if (match[1] === '#') {
      var num;

      if (match[2] === 'x') {
        num = parseInt(match.slice(3), 16);
      } else {
        num = parseInt(match.slice(2), 10);
      } // https://www.w3.org/TR/xml/#NT-Char defines legal XML characters:
      // #x9 | #xA | #xD | [#x20-#xD7FF] | [#xE000-#xFFFD] | [#x10000-#x10FFFF]


      if (num === 0x9 || num === 0xA || num === 0xD || num >= 0x20 && num <= 0xD7FF || num >= 0xE000 && num <= 0xFFFD || num >= 0x10000 && num <= 0x10FFFF) {
        return String.fromCodePoint(num);
      }

      throw new Error('Illegal XML character 0x' + num.toString(16));
    }

    if (unescapeXMLTable[match]) {
      return unescapeXMLTable[match] || match;
    }

    throw new Error('Illegal XML entity ' + match);
  }

  var escapeXML = function escapeXML(s) {
    return s.replace(/&|<|>|"|'/g, escapeXMLReplace);
  };

  var unescapeXML = function unescapeXML(s) {
    var result = '';
    var start = -1;
    var end = -1;
    var previous = 0;

    while ((start = s.indexOf('&', previous)) !== -1 && (end = s.indexOf(';', start + 1)) !== -1) {
      result = result + s.substring(previous, start) + unescapeXMLReplace(s.substring(start, end + 1));
      previous = end + 1;
    } // shortcut if loop never entered:
    // return the original string without creating new objects


    if (previous === 0) return s; // push the remaining characters

    result = result + s.substring(previous);
    return result;
  };

  var escapeXMLText = function escapeXMLText(s) {
    return s.replace(/&|<|>/g, escapeXMLReplace);
  };

  var unescapeXMLText = function unescapeXMLText(s) {
    return s.replace(/&(amp|#38|lt|#60|gt|#62);/g, unescapeXMLReplace);
  };

  var _escape = {
    escapeXML: escapeXML,
    unescapeXML: unescapeXML,
    escapeXMLText: escapeXMLText,
    unescapeXMLText: unescapeXMLText
  };

  function nameEqual(a, b) {
    return a.name === b.name;
  }

  function attrsEqual(a, b) {
    var attrs = a.attrs;
    var keys = Object.keys(attrs);
    var length = keys.length;
    if (length !== Object.keys(b.attrs).length) return false;

    for (var i = 0, l = length; i < l; i++) {
      var key = keys[i];
      var value = attrs[key];

      if (value == null || b.attrs[key] == null) {
        // === null || undefined
        if (value !== b.attrs[key]) return false;
      } else if (value.toString() !== b.attrs[key].toString()) {
        return false;
      }
    }

    return true;
  }

  function childrenEqual(a, b) {
    var children = a.children;
    var length = children.length;
    if (length !== b.children.length) return false;

    for (var i = 0, l = length; i < l; i++) {
      var child = children[i];

      if (typeof child === 'string') {
        if (child !== b.children[i]) return false;
      } else {
        if (!child.equals(b.children[i])) return false;
      }
    }

    return true;
  }

  function equal(a, b) {
    if (!nameEqual(a, b)) return false;
    if (!attrsEqual(a, b)) return false;
    if (!childrenEqual(a, b)) return false;
    return true;
  }

  var name = nameEqual;
  var attrs = attrsEqual;
  var children = childrenEqual;
  var equal_2 = equal;
  var equal_1 = {
    name: name,
    attrs: attrs,
    children: children,
    equal: equal_2
  };

  var clone = function clone(el) {
    var clone = new el.constructor(el.name, el.attrs);

    for (var i = 0; i < el.children.length; i++) {
      var child = el.children[i];
      clone.cnode(child.clone ? child.clone() : child);
    }

    return clone;
  };

  var escapeXML$1 = _escape.escapeXML;
  var escapeXMLText$1 = _escape.escapeXMLText;
  var equal$1 = equal_1.equal;
  var nameEqual$1 = equal_1.name;
  var attrsEqual$1 = equal_1.attrs;
  var childrenEqual$1 = equal_1.children;
  /**
   * Element
   *
   * Attributes are in the element.attrs object. Children is a list of
   * either other Elements or Strings for text content.
   **/

  function Element(name, attrs) {
    this.name = name;
    this.parent = null;
    this.children = [];
    this.attrs = {};
    this.setAttrs(attrs);
  }
  /* Accessors */

  /**
   * if (element.is('message', 'jabber:client')) ...
   **/


  Element.prototype.is = function (name, xmlns) {
    return this.getName() === name && (!xmlns || this.getNS() === xmlns);
  };
  /* without prefix */


  Element.prototype.getName = function () {
    if (this.name.indexOf(':') >= 0) {
      return this.name.substr(this.name.indexOf(':') + 1);
    } else {
      return this.name;
    }
  };
  /**
   * retrieves the namespace of the current element, upwards recursively
   **/


  Element.prototype.getNS = function () {
    if (this.name.indexOf(':') >= 0) {
      var prefix = this.name.substr(0, this.name.indexOf(':'));
      return this.findNS(prefix);
    }

    return this.findNS();
  };
  /**
   * find the namespace to the given prefix, upwards recursively
   **/


  Element.prototype.findNS = function (prefix) {
    if (!prefix) {
      /* default namespace */
      if (this.attrs.xmlns) {
        return this.attrs.xmlns;
      } else if (this.parent) {
        return this.parent.findNS();
      }
    } else {
      /* prefixed namespace */
      var attr = 'xmlns:' + prefix;

      if (this.attrs[attr]) {
        return this.attrs[attr];
      } else if (this.parent) {
        return this.parent.findNS(prefix);
      }
    }
  };
  /**
   * Recursiverly gets all xmlns defined, in the form of {url:prefix}
   **/


  Element.prototype.getXmlns = function () {
    var namespaces = {};

    if (this.parent) {
      namespaces = this.parent.getXmlns();
    }

    for (var attr in this.attrs) {
      var m = attr.match('xmlns:?(.*)');

      if (this.attrs.hasOwnProperty(attr) && m) {
        namespaces[this.attrs[attr]] = m[1];
      }
    }

    return namespaces;
  };

  Element.prototype.setAttrs = function (attrs) {
    if (typeof attrs === 'string') {
      this.attrs.xmlns = attrs;
    } else if (attrs) {
      Object.keys(attrs).forEach(function (key) {
        this.attrs[key] = attrs[key];
      }, this);
    }
  };
  /**
   * xmlns can be null, returns the matching attribute.
   **/


  Element.prototype.getAttr = function (name, xmlns) {
    if (!xmlns) {
      return this.attrs[name];
    }

    var namespaces = this.getXmlns();

    if (!namespaces[xmlns]) {
      return null;
    }

    return this.attrs[[namespaces[xmlns], name].join(':')];
  };
  /**
   * xmlns can be null
   **/


  Element.prototype.getChild = function (name, xmlns) {
    return this.getChildren(name, xmlns)[0];
  };
  /**
   * xmlns can be null
   **/


  Element.prototype.getChildren = function (name, xmlns) {
    var result = [];

    for (var i = 0; i < this.children.length; i++) {
      var child = this.children[i];

      if (child.getName && child.getName() === name && (!xmlns || child.getNS() === xmlns)) {
        result.push(child);
      }
    }

    return result;
  };
  /**
   * xmlns and recursive can be null
   **/


  Element.prototype.getChildByAttr = function (attr, val, xmlns, recursive) {
    return this.getChildrenByAttr(attr, val, xmlns, recursive)[0];
  };
  /**
   * xmlns and recursive can be null
   **/


  Element.prototype.getChildrenByAttr = function (attr, val, xmlns, recursive) {
    var result = [];

    for (var i = 0; i < this.children.length; i++) {
      var child = this.children[i];

      if (child.attrs && child.attrs[attr] === val && (!xmlns || child.getNS() === xmlns)) {
        result.push(child);
      }

      if (recursive && child.getChildrenByAttr) {
        result.push(child.getChildrenByAttr(attr, val, xmlns, true));
      }
    }

    if (recursive) {
      result = [].concat.apply([], result);
    }

    return result;
  };

  Element.prototype.getChildrenByFilter = function (filter, recursive) {
    var result = [];

    for (var i = 0; i < this.children.length; i++) {
      var child = this.children[i];

      if (filter(child)) {
        result.push(child);
      }

      if (recursive && child.getChildrenByFilter) {
        result.push(child.getChildrenByFilter(filter, true));
      }
    }

    if (recursive) {
      result = [].concat.apply([], result);
    }

    return result;
  };

  Element.prototype.getText = function () {
    var text = '';

    for (var i = 0; i < this.children.length; i++) {
      var child = this.children[i];

      if (typeof child === 'string' || typeof child === 'number') {
        text += child;
      }
    }

    return text;
  };

  Element.prototype.getChildText = function (name, xmlns) {
    var child = this.getChild(name, xmlns);
    return child ? child.getText() : null;
  };
  /**
   * Return all direct descendents that are Elements.
   * This differs from `getChildren` in that it will exclude text nodes,
   * processing instructions, etc.
   */


  Element.prototype.getChildElements = function () {
    return this.getChildrenByFilter(function (child) {
      return child instanceof Element;
    });
  };
  /* Builder */

  /** returns uppermost parent */


  Element.prototype.root = function () {
    if (this.parent) {
      return this.parent.root();
    }

    return this;
  };

  Element.prototype.tree = Element.prototype.root;
  /** just parent or itself */

  Element.prototype.up = function () {
    if (this.parent) {
      return this.parent;
    }

    return this;
  };
  /** create child node and return it */


  Element.prototype.c = function (name, attrs) {
    return this.cnode(new Element(name, attrs));
  };

  Element.prototype.cnode = function (child) {
    this.children.push(child);

    if (typeof child === 'object') {
      child.parent = this;
    }

    return child;
  };
  /** add text node and return element */


  Element.prototype.t = function (text) {
    this.children.push(text);
    return this;
  };
  /* Manipulation */

  /**
   * Either:
   *   el.remove(childEl)
   *   el.remove('author', 'urn:...')
   */


  Element.prototype.remove = function (el, xmlns) {
    var filter;

    if (typeof el === 'string') {
      /* 1st parameter is tag name */
      filter = function (child) {
        return !(child.is && child.is(el, xmlns));
      };
    } else {
      /* 1st parameter is element */
      filter = function (child) {
        return child !== el;
      };
    }

    this.children = this.children.filter(filter);
    return this;
  };

  Element.prototype.clone = function () {
    return clone(this);
  };

  Element.prototype.text = function (val) {
    if (val && this.children.length === 1) {
      this.children[0] = val;
      return this;
    }

    return this.getText();
  };

  Element.prototype.attr = function (attr, val) {
    if (typeof val !== 'undefined' || val === null) {
      if (!this.attrs) {
        this.attrs = {};
      }

      this.attrs[attr] = val;
      return this;
    }

    return this.attrs[attr];
  };
  /* Serialization */


  Element.prototype.toString = function () {
    var s = '';
    this.write(function (c) {
      s += c;
    });
    return s;
  };

  Element.prototype.toJSON = function () {
    return {
      name: this.name,
      attrs: this.attrs,
      children: this.children.map(function (child) {
        return child && child.toJSON ? child.toJSON() : child;
      })
    };
  };

  Element.prototype._addChildren = function (writer) {
    writer('>');

    for (var i = 0; i < this.children.length; i++) {
      var child = this.children[i];
      /* Skip null/undefined */

      if (child || child === 0) {
        if (child.write) {
          child.write(writer);
        } else if (typeof child === 'string') {
          writer(escapeXMLText$1(child));
        } else if (child.toString) {
          writer(escapeXMLText$1(child.toString(10)));
        }
      }
    }

    writer('</');
    writer(this.name);
    writer('>');
  };

  Element.prototype.write = function (writer) {
    writer('<');
    writer(this.name);

    for (var k in this.attrs) {
      var v = this.attrs[k];

      if (v != null) {
        // === null || undefined
        writer(' ');
        writer(k);
        writer('="');

        if (typeof v !== 'string') {
          v = v.toString();
        }

        writer(escapeXML$1(v));
        writer('"');
      }
    }

    if (this.children.length === 0) {
      writer('/>');
    } else {
      this._addChildren(writer);
    }
  };

  Element.prototype.nameEquals = function (el) {
    return nameEqual$1(this, el);
  };

  Element.prototype.attrsEquals = function (el) {
    return attrsEqual$1(this, el);
  };

  Element.prototype.childrenEquals = function (el) {
    return childrenEqual$1(this, el);
  };

  Element.prototype.equals = function (el) {
    return equal$1(this, el);
  };

  var Element_1 = Element;

  class Element$1 extends Element_1 {
    setAttrs(attrs) {
      if (typeof attrs === 'string') {
        this.attrs.xmlns = attrs;
      } else if (attrs) {
        Object.keys(attrs).forEach(function (key) {
          const val = attrs[key];
          if (val !== undefined && val !== null) this.attrs[key.toString()] = val.toString();
        }, this);
      }
    }

    append(nodes) {
      nodes = Array.isArray(nodes) ? nodes : [nodes];
      nodes.forEach(node => {
        this.children.push(node);

        if (typeof node === 'object') {
          node.parent = this;
        }
      });
      return this;
    }

    prepend(nodes) {
      nodes = Array.isArray(nodes) ? nodes : [nodes];
      nodes.forEach(node => {
        this.children.unshift(node);

        if (typeof node === 'object') {
          node.parent = this;
        }
      });
      return this;
    }

  }

  var Element_1$1 = Element$1;

  function append(el, child) {
    if (child instanceof Element_1$1) {
      el.append(child);
    } else if (Array.isArray(child)) {
      child.forEach(c => append(el, c));
    } else if (child !== null && child !== undefined) {
      el.append(String(child));
    }
  }

  function x(name, attrs, ...children) {
    const el = new Element_1$1(name, attrs); // eslint-disable-next-line unicorn/no-for-loop

    for (let i = 0; i < children.length; i++) {
      append(el, children[i]);
    }

    return el;
  }

  var x_1 = x;

  // shim for using process in browser
  // based off https://github.com/defunctzombie/node-process/blob/master/browser.js
  function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
  }

  function defaultClearTimeout() {
    throw new Error('clearTimeout has not been defined');
  }

  var cachedSetTimeout = defaultSetTimout;
  var cachedClearTimeout = defaultClearTimeout;

  if (typeof global.setTimeout === 'function') {
    cachedSetTimeout = setTimeout;
  }

  if (typeof global.clearTimeout === 'function') {
    cachedClearTimeout = clearTimeout;
  }

  function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
      //normal enviroments in sane situations
      return setTimeout(fun, 0);
    } // if setTimeout wasn't available but was latter defined


    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
      cachedSetTimeout = setTimeout;
      return setTimeout(fun, 0);
    }

    try {
      // when when somebody has screwed with setTimeout but no I.E. maddness
      return cachedSetTimeout(fun, 0);
    } catch (e) {
      try {
        // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
        return cachedSetTimeout.call(null, fun, 0);
      } catch (e) {
        // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
        return cachedSetTimeout.call(this, fun, 0);
      }
    }
  }

  function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
      //normal enviroments in sane situations
      return clearTimeout(marker);
    } // if clearTimeout wasn't available but was latter defined


    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
      cachedClearTimeout = clearTimeout;
      return clearTimeout(marker);
    }

    try {
      // when when somebody has screwed with setTimeout but no I.E. maddness
      return cachedClearTimeout(marker);
    } catch (e) {
      try {
        // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
        return cachedClearTimeout.call(null, marker);
      } catch (e) {
        // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
        // Some versions of I.E. have different rules for clearTimeout vs setTimeout
        return cachedClearTimeout.call(this, marker);
      }
    }
  }

  var queue = [];
  var draining = false;
  var currentQueue;
  var queueIndex = -1;

  function cleanUpNextTick() {
    if (!draining || !currentQueue) {
      return;
    }

    draining = false;

    if (currentQueue.length) {
      queue = currentQueue.concat(queue);
    } else {
      queueIndex = -1;
    }

    if (queue.length) {
      drainQueue();
    }
  }

  function drainQueue() {
    if (draining) {
      return;
    }

    var timeout = runTimeout(cleanUpNextTick);
    draining = true;
    var len = queue.length;

    while (len) {
      currentQueue = queue;
      queue = [];

      while (++queueIndex < len) {
        if (currentQueue) {
          currentQueue[queueIndex].run();
        }
      }

      queueIndex = -1;
      len = queue.length;
    }

    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
  }

  function nextTick(fun) {
    var args = new Array(arguments.length - 1);

    if (arguments.length > 1) {
      for (var i = 1; i < arguments.length; i++) {
        args[i - 1] = arguments[i];
      }
    }

    queue.push(new Item(fun, args));

    if (queue.length === 1 && !draining) {
      runTimeout(drainQueue);
    }
  } // v8 likes predictible objects

  function Item(fun, array) {
    this.fun = fun;
    this.array = array;
  }

  Item.prototype.run = function () {
    this.fun.apply(null, this.array);
  };

  var performance = global.performance || {};

  var performanceNow = performance.now || performance.mozNow || performance.msNow || performance.oNow || performance.webkitNow || function () {
    return new Date().getTime();
  }; // generate timestamp or delta

  var inherits;

  if (typeof Object.create === 'function') {
    inherits = function inherits(ctor, superCtor) {
      // implementation from standard node.js 'util' module
      ctor.super_ = superCtor;
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
    inherits = function inherits(ctor, superCtor) {
      ctor.super_ = superCtor;

      var TempCtor = function () {};

      TempCtor.prototype = superCtor.prototype;
      ctor.prototype = new TempCtor();
      ctor.prototype.constructor = ctor;
    };
  }

  var inherits$1 = inherits;

  // Copyright Joyent, Inc. and other Node contributors.
  var formatRegExp = /%[sdj%]/g;
  function format(f) {
    if (!isString(f)) {
      var objects = [];

      for (var i = 0; i < arguments.length; i++) {
        objects.push(inspect(arguments[i]));
      }

      return objects.join(' ');
    }

    var i = 1;
    var args = arguments;
    var len = args.length;
    var str = String(f).replace(formatRegExp, function (x) {
      if (x === '%%') return '%';
      if (i >= len) return x;

      switch (x) {
        case '%s':
          return String(args[i++]);

        case '%d':
          return Number(args[i++]);

        case '%j':
          try {
            return JSON.stringify(args[i++]);
          } catch (_) {
            return '[Circular]';
          }

        default:
          return x;
      }
    });

    for (var x = args[i]; i < len; x = args[++i]) {
      if (isNull(x) || !isObject(x)) {
        str += ' ' + x;
      } else {
        str += ' ' + inspect(x);
      }
    }

    return str;
  }
  // Returns a modified function which warns once by default.
  // If --no-deprecation is set, then it is a no-op.

  function deprecate(fn, msg) {
    // Allow for deprecating things in the process of starting up.
    if (isUndefined(global.process)) {
      return function () {
        return deprecate(fn, msg).apply(this, arguments);
      };
    }

    var warned = false;

    function deprecated() {
      if (!warned) {
        {
          console.error(msg);
        }

        warned = true;
      }

      return fn.apply(this, arguments);
    }

    return deprecated;
  }
  var debugs = {};
  var debugEnviron;
  function debuglog(set) {
    if (isUndefined(debugEnviron)) debugEnviron =  '';
    set = set.toUpperCase();

    if (!debugs[set]) {
      if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
        var pid = 0;

        debugs[set] = function () {
          var msg = format.apply(null, arguments);
          console.error('%s %d: %s', set, pid, msg);
        };
      } else {
        debugs[set] = function () {};
      }
    }

    return debugs[set];
  }
  /**
   * Echos the value of a value. Trys to print the value out
   * in the best way possible given the different types.
   *
   * @param {Object} obj The object to print out.
   * @param {Object} opts Optional options object that alters the output.
   */

  /* legacy: obj, showHidden, depth, colors*/

  function inspect(obj, opts) {
    // default options
    var ctx = {
      seen: [],
      stylize: stylizeNoColor
    }; // legacy...

    if (arguments.length >= 3) ctx.depth = arguments[2];
    if (arguments.length >= 4) ctx.colors = arguments[3];

    if (isBoolean(opts)) {
      // legacy...
      ctx.showHidden = opts;
    } else if (opts) {
      // got an "options" object
      _extend(ctx, opts);
    } // set default options


    if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
    if (isUndefined(ctx.depth)) ctx.depth = 2;
    if (isUndefined(ctx.colors)) ctx.colors = false;
    if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
    if (ctx.colors) ctx.stylize = stylizeWithColor;
    return formatValue(ctx, obj, ctx.depth);
  } // http://en.wikipedia.org/wiki/ANSI_escape_code#graphics

  inspect.colors = {
    'bold': [1, 22],
    'italic': [3, 23],
    'underline': [4, 24],
    'inverse': [7, 27],
    'white': [37, 39],
    'grey': [90, 39],
    'black': [30, 39],
    'blue': [34, 39],
    'cyan': [36, 39],
    'green': [32, 39],
    'magenta': [35, 39],
    'red': [31, 39],
    'yellow': [33, 39]
  }; // Don't use 'blue' not visible on cmd.exe

  inspect.styles = {
    'special': 'cyan',
    'number': 'yellow',
    'boolean': 'yellow',
    'undefined': 'grey',
    'null': 'bold',
    'string': 'green',
    'date': 'magenta',
    // "name": intentionally not styling
    'regexp': 'red'
  };

  function stylizeWithColor(str, styleType) {
    var style = inspect.styles[styleType];

    if (style) {
      return '\u001b[' + inspect.colors[style][0] + 'm' + str + '\u001b[' + inspect.colors[style][1] + 'm';
    } else {
      return str;
    }
  }

  function stylizeNoColor(str, styleType) {
    return str;
  }

  function arrayToHash(array) {
    var hash = {};
    array.forEach(function (val, idx) {
      hash[val] = true;
    });
    return hash;
  }

  function formatValue(ctx, value, recurseTimes) {
    // Provide a hook for user-specified inspect functions.
    // Check that value is an object with an inspect function on it
    if (ctx.customInspect && value && isFunction(value.inspect) && // Filter out the util module, it's inspect function is special
    value.inspect !== inspect && // Also filter out any prototype objects using the circular check.
    !(value.constructor && value.constructor.prototype === value)) {
      var ret = value.inspect(recurseTimes, ctx);

      if (!isString(ret)) {
        ret = formatValue(ctx, ret, recurseTimes);
      }

      return ret;
    } // Primitive types cannot have properties


    var primitive = formatPrimitive(ctx, value);

    if (primitive) {
      return primitive;
    } // Look up the keys of the object.


    var keys = Object.keys(value);
    var visibleKeys = arrayToHash(keys);

    if (ctx.showHidden) {
      keys = Object.getOwnPropertyNames(value);
    } // IE doesn't make error fields non-enumerable
    // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx


    if (isError(value) && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
      return formatError(value);
    } // Some type of object without properties can be shortcutted.


    if (keys.length === 0) {
      if (isFunction(value)) {
        var name = value.name ? ': ' + value.name : '';
        return ctx.stylize('[Function' + name + ']', 'special');
      }

      if (isRegExp(value)) {
        return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
      }

      if (isDate(value)) {
        return ctx.stylize(Date.prototype.toString.call(value), 'date');
      }

      if (isError(value)) {
        return formatError(value);
      }
    }

    var base = '',
        array = false,
        braces = ['{', '}']; // Make Array say that they are Array

    if (isArray(value)) {
      array = true;
      braces = ['[', ']'];
    } // Make functions say that they are functions


    if (isFunction(value)) {
      var n = value.name ? ': ' + value.name : '';
      base = ' [Function' + n + ']';
    } // Make RegExps say that they are RegExps


    if (isRegExp(value)) {
      base = ' ' + RegExp.prototype.toString.call(value);
    } // Make dates with properties first say the date


    if (isDate(value)) {
      base = ' ' + Date.prototype.toUTCString.call(value);
    } // Make error with message first say the error


    if (isError(value)) {
      base = ' ' + formatError(value);
    }

    if (keys.length === 0 && (!array || value.length == 0)) {
      return braces[0] + base + braces[1];
    }

    if (recurseTimes < 0) {
      if (isRegExp(value)) {
        return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
      } else {
        return ctx.stylize('[Object]', 'special');
      }
    }

    ctx.seen.push(value);
    var output;

    if (array) {
      output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
    } else {
      output = keys.map(function (key) {
        return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
      });
    }

    ctx.seen.pop();
    return reduceToSingleString(output, base, braces);
  }

  function formatPrimitive(ctx, value) {
    if (isUndefined(value)) return ctx.stylize('undefined', 'undefined');

    if (isString(value)) {
      var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '').replace(/'/g, "\\'").replace(/\\"/g, '"') + '\'';
      return ctx.stylize(simple, 'string');
    }

    if (isNumber(value)) return ctx.stylize('' + value, 'number');
    if (isBoolean(value)) return ctx.stylize('' + value, 'boolean'); // For some reason typeof null is "object", so special case here.

    if (isNull(value)) return ctx.stylize('null', 'null');
  }

  function formatError(value) {
    return '[' + Error.prototype.toString.call(value) + ']';
  }

  function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
    var output = [];

    for (var i = 0, l = value.length; i < l; ++i) {
      if (hasOwnProperty(value, String(i))) {
        output.push(formatProperty(ctx, value, recurseTimes, visibleKeys, String(i), true));
      } else {
        output.push('');
      }
    }

    keys.forEach(function (key) {
      if (!key.match(/^\d+$/)) {
        output.push(formatProperty(ctx, value, recurseTimes, visibleKeys, key, true));
      }
    });
    return output;
  }

  function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
    var name, str, desc;
    desc = Object.getOwnPropertyDescriptor(value, key) || {
      value: value[key]
    };

    if (desc.get) {
      if (desc.set) {
        str = ctx.stylize('[Getter/Setter]', 'special');
      } else {
        str = ctx.stylize('[Getter]', 'special');
      }
    } else {
      if (desc.set) {
        str = ctx.stylize('[Setter]', 'special');
      }
    }

    if (!hasOwnProperty(visibleKeys, key)) {
      name = '[' + key + ']';
    }

    if (!str) {
      if (ctx.seen.indexOf(desc.value) < 0) {
        if (isNull(recurseTimes)) {
          str = formatValue(ctx, desc.value, null);
        } else {
          str = formatValue(ctx, desc.value, recurseTimes - 1);
        }

        if (str.indexOf('\n') > -1) {
          if (array) {
            str = str.split('\n').map(function (line) {
              return '  ' + line;
            }).join('\n').substr(2);
          } else {
            str = '\n' + str.split('\n').map(function (line) {
              return '   ' + line;
            }).join('\n');
          }
        }
      } else {
        str = ctx.stylize('[Circular]', 'special');
      }
    }

    if (isUndefined(name)) {
      if (array && key.match(/^\d+$/)) {
        return str;
      }

      name = JSON.stringify('' + key);

      if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
        name = name.substr(1, name.length - 2);
        name = ctx.stylize(name, 'name');
      } else {
        name = name.replace(/'/g, "\\'").replace(/\\"/g, '"').replace(/(^"|"$)/g, "'");
        name = ctx.stylize(name, 'string');
      }
    }

    return name + ': ' + str;
  }

  function reduceToSingleString(output, base, braces) {
    var length = output.reduce(function (prev, cur) {
      if (cur.indexOf('\n') >= 0) ;
      return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
    }, 0);

    if (length > 60) {
      return braces[0] + (base === '' ? '' : base + '\n ') + ' ' + output.join(',\n  ') + ' ' + braces[1];
    }

    return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
  } // NOTE: These type checking functions intentionally don't use `instanceof`
  // because it is fragile and can be easily faked with `Object.create()`.


  function isArray(ar) {
    return Array.isArray(ar);
  }
  function isBoolean(arg) {
    return typeof arg === 'boolean';
  }
  function isNull(arg) {
    return arg === null;
  }
  function isNullOrUndefined(arg) {
    return arg == null;
  }
  function isNumber(arg) {
    return typeof arg === 'number';
  }
  function isString(arg) {
    return typeof arg === 'string';
  }
  function isSymbol(arg) {
    return typeof arg === 'symbol';
  }
  function isUndefined(arg) {
    return arg === void 0;
  }
  function isRegExp(re) {
    return isObject(re) && objectToString(re) === '[object RegExp]';
  }
  function isObject(arg) {
    return typeof arg === 'object' && arg !== null;
  }
  function isDate(d) {
    return isObject(d) && objectToString(d) === '[object Date]';
  }
  function isError(e) {
    return isObject(e) && (objectToString(e) === '[object Error]' || e instanceof Error);
  }
  function isFunction(arg) {
    return typeof arg === 'function';
  }
  function isPrimitive(arg) {
    return arg === null || typeof arg === 'boolean' || typeof arg === 'number' || typeof arg === 'string' || typeof arg === 'symbol' || // ES6 symbol
    typeof arg === 'undefined';
  }
  function isBuffer(maybeBuf) {
    return Buffer.isBuffer(maybeBuf);
  }

  function objectToString(o) {
    return Object.prototype.toString.call(o);
  }

  function pad(n) {
    return n < 10 ? '0' + n.toString(10) : n.toString(10);
  }

  var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']; // 26 Feb 16:19:34

  function timestamp() {
    var d = new Date();
    var time = [pad(d.getHours()), pad(d.getMinutes()), pad(d.getSeconds())].join(':');
    return [d.getDate(), months[d.getMonth()], time].join(' ');
  } // log is just a thin wrapper to console.log that prepends a timestamp


  function log() {
    console.log('%s - %s', timestamp(), format.apply(null, arguments));
  }
  function _extend(origin, add) {
    // Don't do anything if add isn't an object
    if (!add || !isObject(add)) return origin;
    var keys = Object.keys(add);
    var i = keys.length;

    while (i--) {
      origin[keys[i]] = add[keys[i]];
    }

    return origin;
  }

  function hasOwnProperty(obj, prop) {
    return Object.prototype.hasOwnProperty.call(obj, prop);
  }

  var require$$0 = {
    inherits: inherits$1,
    _extend: _extend,
    log: log,
    isBuffer: isBuffer,
    isPrimitive: isPrimitive,
    isFunction: isFunction,
    isError: isError,
    isDate: isDate,
    isObject: isObject,
    isRegExp: isRegExp,
    isUndefined: isUndefined,
    isSymbol: isSymbol,
    isString: isString,
    isNumber: isNumber,
    isNullOrUndefined: isNullOrUndefined,
    isNull: isNull,
    isBoolean: isBoolean,
    isArray: isArray,
    inspect: inspect,
    deprecate: deprecate,
    format: format,
    debuglog: debuglog
  };

  var inherits_browser = createCommonjsModule(function (module) {
    if (typeof Object.create === 'function') {
      // implementation from standard node.js 'util' module
      module.exports = function inherits(ctor, superCtor) {
        ctor.super_ = superCtor;
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
        ctor.super_ = superCtor;

        var TempCtor = function () {};

        TempCtor.prototype = superCtor.prototype;
        ctor.prototype = new TempCtor();
        ctor.prototype.constructor = ctor;
      };
    }
  });

  var inherits$2 = createCommonjsModule(function (module) {
    try {
      var util = require$$0;
      if (typeof util.inherits !== 'function') throw '';
      module.exports = util.inherits;
    } catch (e) {
      module.exports = inherits_browser;
    }
  });

  var ltx = createCommonjsModule(function (module) {

    var EventEmitter$1 = EventEmitter.EventEmitter;
    var unescapeXML = _escape.unescapeXML;
    var STATE_TEXT = 0;
    var STATE_IGNORE_COMMENT = 1;
    var STATE_IGNORE_INSTRUCTION = 2;
    var STATE_TAG_NAME = 3;
    var STATE_TAG = 4;
    var STATE_ATTR_NAME = 5;
    var STATE_ATTR_EQ = 6;
    var STATE_ATTR_QUOT = 7;
    var STATE_ATTR_VALUE = 8;
    var STATE_CDATA = 9;

    var SaxLtx = module.exports = function SaxLtx() {
      EventEmitter$1.call(this);
      var state = STATE_TEXT;
      var remainder;
      var tagName;
      var attrs;
      var endTag;
      var selfClosing;
      var attrQuote;
      var attrQuoteChar;
      var recordStart = 0;
      var attrName;

      this._handleTagOpening = function (endTag, tagName, attrs) {
        if (!endTag) {
          this.emit('startElement', tagName, attrs);

          if (selfClosing) {
            this.emit('endElement', tagName);
          }
        } else {
          this.emit('endElement', tagName);
        }
      };

      this.write = function (data) {
        if (typeof data !== 'string') {
          data = data.toString();
        }

        var pos = 0;
        /* Anything from previous write()? */

        if (remainder) {
          data = remainder + data;
          pos += remainder.length;
          remainder = null;
        }

        function endRecording() {
          if (typeof recordStart === 'number') {
            var recorded = data.substring(recordStart, pos);
            recordStart = undefined;
            return recorded;
          }
        }

        for (; pos < data.length; pos++) {
          if (state === STATE_TEXT) {
            // if we're looping through text, fast-forward using indexOf to
            // the next '<' character
            var lt = data.indexOf('<', pos);

            if (lt !== -1 && pos !== lt) {
              pos = lt;
            }
          } else if (state === STATE_ATTR_VALUE) {
            // if we're looping through an attribute, fast-forward using
            // indexOf to the next end quote character
            var quot = data.indexOf(attrQuoteChar, pos);

            if (quot !== -1) {
              pos = quot;
            }
          } else if (state === STATE_IGNORE_COMMENT) {
            // if we're looping through a comment, fast-forward using
            // indexOf to the first end-comment character
            var endcomment = data.indexOf('-->', pos);

            if (endcomment !== -1) {
              pos = endcomment + 2; // target the '>' character
            }
          }

          var c = data.charCodeAt(pos);

          switch (state) {
            case STATE_TEXT:
              if (c === 60
              /* < */
              ) {
                  var text = endRecording();

                  if (text) {
                    this.emit('text', unescapeXML(text));
                  }

                  state = STATE_TAG_NAME;
                  recordStart = pos + 1;
                  attrs = {};
                }

              break;

            case STATE_CDATA:
              if (c === 93
              /* ] */
              && data.substr(pos + 1, 2) === ']>') {
                var cData = endRecording();

                if (cData) {
                  this.emit('text', cData);
                }

                state = STATE_IGNORE_COMMENT;
              }

              break;

            case STATE_TAG_NAME:
              if (c === 47
              /* / */
              && recordStart === pos) {
                recordStart = pos + 1;
                endTag = true;
              } else if (c === 33
              /* ! */
              ) {
                  if (data.substr(pos + 1, 7) === '[CDATA[') {
                    recordStart = pos + 8;
                    state = STATE_CDATA;
                  } else {
                    recordStart = undefined;
                    state = STATE_IGNORE_COMMENT;
                  }
                } else if (c === 63
              /* ? */
              ) {
                  recordStart = undefined;
                  state = STATE_IGNORE_INSTRUCTION;
                } else if (c <= 32 || c === 47
              /* / */
              || c === 62
              /* > */
              ) {
                  tagName = endRecording();
                  pos--;
                  state = STATE_TAG;
                }

              break;

            case STATE_IGNORE_COMMENT:
              if (c === 62
              /* > */
              ) {
                  var prevFirst = data.charCodeAt(pos - 1);
                  var prevSecond = data.charCodeAt(pos - 2);

                  if (prevFirst === 45
                  /* - */
                  && prevSecond === 45
                  /* - */
                  || prevFirst === 93
                  /* ] */
                  && prevSecond === 93
                  /* ] */
                  ) {
                    state = STATE_TEXT;
                  }
                }

              break;

            case STATE_IGNORE_INSTRUCTION:
              if (c === 62
              /* > */
              ) {
                  var prev = data.charCodeAt(pos - 1);

                  if (prev === 63
                  /* ? */
                  ) {
                      state = STATE_TEXT;
                    }
                }

              break;

            case STATE_TAG:
              if (c === 62
              /* > */
              ) {
                  this._handleTagOpening(endTag, tagName, attrs);

                  tagName = undefined;
                  attrs = undefined;
                  endTag = undefined;
                  selfClosing = undefined;
                  state = STATE_TEXT;
                  recordStart = pos + 1;
                } else if (c === 47
              /* / */
              ) {
                  selfClosing = true;
                } else if (c > 32) {
                recordStart = pos;
                state = STATE_ATTR_NAME;
              }

              break;

            case STATE_ATTR_NAME:
              if (c <= 32 || c === 61
              /* = */
              ) {
                  attrName = endRecording();
                  pos--;
                  state = STATE_ATTR_EQ;
                }

              break;

            case STATE_ATTR_EQ:
              if (c === 61
              /* = */
              ) {
                  state = STATE_ATTR_QUOT;
                }

              break;

            case STATE_ATTR_QUOT:
              if (c === 34
              /* " */
              || c === 39
              /* ' */
              ) {
                  attrQuote = c;
                  attrQuoteChar = c === 34 ? '"' : "'";
                  state = STATE_ATTR_VALUE;
                  recordStart = pos + 1;
                }

              break;

            case STATE_ATTR_VALUE:
              if (c === attrQuote) {
                var value = unescapeXML(endRecording());
                attrs[attrName] = value;
                attrName = undefined;
                state = STATE_TAG;
              }

              break;
          }
        }

        if (typeof recordStart === 'number' && recordStart <= data.length) {
          remainder = data.slice(recordStart);
          recordStart = 0;
        }
      };
    };

    inherits$2(SaxLtx, EventEmitter$1);

    SaxLtx.prototype.end = function (data) {
      if (data) {
        this.write(data);
      }
      /* Uh, yeah */


      this.write = function () {};
    };
  });

  class XMLError extends Error {
    constructor(...args) {
      super(...args);
      this.name = 'XMLError';
    }

  }

  class Parser extends EventEmitter {
    constructor() {
      super();
      const parser = new ltx();
      this.root = null;
      this.cursor = null;
      parser.on('startElement', this.onStartElement.bind(this));
      parser.on('endElement', this.onEndElement.bind(this));
      parser.on('text', this.onText.bind(this));
      this.parser = parser;
    }

    onStartElement(name, attrs) {
      const element = new Element_1$1(name, attrs);
      const {
        root,
        cursor
      } = this;

      if (!root) {
        this.root = element;
        this.emit('start', element);
      } else if (cursor !== root) {
        cursor.append(element);
      }

      this.cursor = element;
    }

    onEndElement(name) {
      const {
        root,
        cursor
      } = this;

      if (name !== cursor.name) {
        // <foo></bar>
        this.emit('error', new XMLError(`${cursor.name} must be closed.`));
        return;
      }

      if (cursor === root) {
        this.emit('end', root);
        return;
      }

      if (!cursor.parent) {
        if (cursor.name.startsWith('stream:')) {
          cursor.attrs['xmlns:stream'] = root.attrs['xmlns:stream'];
        }

        this.emit('element', cursor);
        this.cursor = root;
        return;
      }

      this.cursor = cursor.parent;
    }

    onText(str) {
      const {
        cursor
      } = this;

      if (!cursor) {
        this.emit('error', new XMLError(`${str} must be a child.`));
        return;
      }

      cursor.t(str);
    }

    write(data) {
      this.parser.write(data);
    }

    end(data) {
      if (data) {
        this.parser.write(data);
      }
    }

  }

  Parser.XMLError = XMLError;
  var Parser_1 = Parser;

  var esm$2 = createCommonjsModule(function (module, exports) {
    const {
      escapeXML,
      unescapeXML,
      escapeXMLText,
      unescapeXMLText
    } = _escape;

    function xml(...args) {
      return x_1(...args);
    } // eslint-disable-next-line no-global-assign


    exports = module.exports = xml;
    Object.assign(exports, {
      x: x_1,
      Element: Element_1$1,
      Parser: Parser_1,
      escapeXML,
      unescapeXML,
      escapeXMLText,
      unescapeXMLText
    });
  });

  class XMPPError extends Error {
    constructor(condition, text, application) {
      super(condition + (text ? ` - ${text}` : ''));
      this.name = 'XMPPError';
      this.condition = condition;
      this.text = text;
      this.application = application;
    }

    static fromElement(element) {
      const [condition, second, third] = element.children;
      let text;
      let application;

      if (second) {
        if (second.is('text')) {
          text = second;
        } else if (second) {
          application = second;
        }

        if (third) application = third;
      }

      const error = new this(condition.name, text ? text.text() : '', application);
      error.element = element;
      return error;
    }

  }

  var esm$3 = XMPPError;

  class StreamError extends esm$3 {
    constructor(...args) {
      super(...args);
      this.name = 'StreamError';
    }

  }

  var StreamError_1 = StreamError;

  const {
    EventEmitter: EventEmitter$1,
    promise: promise$1
  } = esm;
  const NS_STREAM = 'urn:ietf:params:xml:ns:xmpp-streams';

  function socketConnect(socket, ...params) {
    return new Promise((resolve, reject) => {
      function onError(err) {
        socket.removeListener('connect', onConnect);
        reject(err);
      }

      function onConnect(value) {
        socket.removeListener('error', onError);
        resolve(value);
      }

      socket.once('error', onError);
      socket.once('connect', onConnect);
      socket.connect(...params);
    });
  }

  class Connection extends EventEmitter$1 {
    constructor(options = {}) {
      super();
      this.jid = null;
      this.timeout = 2000;
      this.options = options;
      this.socketListeners = Object.create(null);
      this.parserListeners = Object.create(null);
      this.status = 'offline';
      this.socket = null;
      this.parser = null;
    }

    _reset() {
      this.jid = null;
      this.status = 'offline';

      this._detachSocket();

      this._detachParser();
    }

    async _streamError(condition) {
      try {
        await this.send( // prettier-ignore
        esm$2('stream:error', {}, [esm$2(condition, {
          xmlns: NS_STREAM
        })]));
      } catch (err) {}

      return this._end();
    }

    async _onData(data) {
      const str = data.toString('utf8');
      this.emit('input', str);

      try {
        await this.parser.write(str);
      } catch (err) {
        // https://xmpp.org/rfcs/rfc6120.html#streams-error-conditions-bad-format
        // "This error can be used instead of the more specific XML-related errors,
        // such as <bad-namespace-prefix/>, <invalid-xml/>, <not-well-formed/>, <restricted-xml/>,
        // and <unsupported-encoding/>. However, the more specific errors are RECOMMENDED."
        try {
          this._streamError('bad-format');
        } catch (err) {}
      }
    }

    _attachSocket(socket) {
      const sock = this.socket = socket;
      const listeners = this.socketListeners;

      listeners.data = data => {
        this._onData(data);
      };

      listeners.close = (dirty, event) => {
        this._reset();

        this._status('disconnect', {
          clean: !dirty,
          event
        });
      };

      listeners.connect = () => {
        this._status('connect');
      };

      listeners.error = error => {
        this.emit('error', error);
      };

      sock.on('close', listeners.close);
      sock.on('data', listeners.data);
      sock.on('error', listeners.error);
      sock.on('connect', listeners.connect);
    }

    _detachSocket() {
      const {
        socketListeners,
        socket
      } = this;
      Object.getOwnPropertyNames(socketListeners).forEach(k => {
        socket.removeListener(k, socketListeners[k]);
        delete socketListeners[k];
      });
      this.socket = null;
      return socket;
    }

    _onElement(element) {
      this.emit('element', element);
      this.emit(this.isStanza(element) ? 'stanza' : 'nonza', element); // https://xmpp.org/rfcs/rfc6120.html#streams-error

      if (element.name !== 'stream:error') return;
      this.emit('error', StreamError_1.fromElement(element)); // "Stream Errors Are Unrecoverable"
      // "The entity that receives the stream error then SHALL close the stream"

      this._end();
    }

    _attachParser(p) {
      const parser = this.parser = p;
      const listeners = this.parserListeners;

      listeners.element = element => {
        this._onElement(element);
      };

      listeners.error = error => {
        this._detachParser();

        this.emit('error', error);
      };

      listeners.end = element => {
        this._detachParser();

        this._status('close', element);
      };

      parser.on('error', listeners.error);
      parser.on('element', listeners.element);
      parser.on('end', listeners.end);
    }

    _detachParser() {
      const listeners = this.parserListeners;
      Object.getOwnPropertyNames(listeners).forEach(k => {
        this.parser.removeListener(k, listeners[k]);
        delete listeners[k];
      });
      this.parser = null;
    }

    _jid(id) {
      this.jid = esm$1(id);
      return this.jid;
    }

    _status(status, ...args) {
      this.status = status;
      this.emit('status', status, ...args);
      this.emit(status, ...args);
    }

    async _end() {
      let el;

      try {
        el = await this.close();
      } catch (err) {}

      try {
        await this.disconnect();
      } catch (err) {}

      return el;
    }
    /**
     * Opens the socket then opens the stream
     */


    async start() {
      if (this.status !== 'offline') {
        throw new Error('Connection is not offline');
      }

      const {
        service,
        domain,
        lang
      } = this.options;
      await this.connect(service);
      const promiseOnline = promise$1(this, 'online');
      await this.open({
        domain,
        lang
      });
      return promiseOnline;
    }
    /**
     * Connects the socket
     */
    // eslint-disable-next-line require-await


    async connect(service) {
      this._status('connecting');

      this._attachSocket(new this.Socket()); // The 'connect' status is set by the socket 'connect' listener


      return socketConnect(this.socket, this.socketParameters(service));
    }
    /**
     * Disconnects the socket
     * https://xmpp.org/rfcs/rfc6120.html#streams-close
     * https://tools.ietf.org/html/rfc7395#section-3.6
     */


    async disconnect(timeout = this.timeout) {
      if (this.socket) this._status('disconnecting');
      this.socket.end(); // The 'disconnect' status is set by the socket 'close' listener

      await promise$1(this.socket, 'close', 'error', timeout);
    }
    /**
     * Opens the stream
     */


    async open(options) {
      this._status('opening');

      if (typeof options === 'string') {
        options = {
          domain: options
        };
      }

      const {
        domain,
        lang,
        timeout = this.timeout
      } = options;
      const headerElement = this.headerElement();
      headerElement.attrs.to = domain;
      headerElement.attrs['xml:lang'] = lang;

      this._attachParser(new this.Parser());

      await this.write(this.header(headerElement));
      const el = await promise$1(this.parser, 'start', 'error', timeout);

      this._status('open', el);
    }
    /**
     * Closes the stream then closes the socket
     * https://xmpp.org/rfcs/rfc6120.html#streams-close
     * https://tools.ietf.org/html/rfc7395#section-3.6
     */


    async stop() {
      const el = await this._end();
      if (this.status !== 'offline') this._status('offline', el);
      return el;
    }
    /**
     * Closes the stream and wait for the server to close it
     * https://xmpp.org/rfcs/rfc6120.html#streams-close
     * https://tools.ietf.org/html/rfc7395#section-3.6
     */


    async close(timeout = this.timeout) {
      const p = Promise.all([promise$1(this.parser, 'end', 'error', timeout), this.write(this.footer(this.footerElement()))]);
      if (this.parser && this.socket) this._status('closing');
      const [el] = await p;
      return el; // The 'close' status is set by the parser 'end' listener
    }
    /**
     * Restart the stream
     * https://xmpp.org/rfcs/rfc6120.html#streams-negotiation-restart
     */
    // eslint-disable-next-line require-await


    async restart() {
      this._detachParser();

      const {
        domain,
        lang
      } = this.options;
      return this.open({
        domain,
        lang
      });
    } // eslint-disable-next-line require-await


    async send(element) {
      this.emit('outgoing', element);
      await this.write(element);
      this.emit('send', element);
    }

    sendReceive(element, timeout = this.timeout) {
      return Promise.all([this.send(element), promise$1(this, 'element', 'error', timeout)]).then(([, el]) => el);
    }

    write(data) {
      return new Promise((resolve, reject) => {
        // https://xmpp.org/rfcs/rfc6120.html#streams-close
        // "Refrain from sending any further data over its outbound stream to the other entity"
        if (this.status === 'closing') {
          reject(new Error('Connection is closing'));
          return;
        }

        const str = data.toString('utf8');
        this.socket.write(str, err => {
          if (err) {
            return reject(err);
          }

          this.emit('output', str);
          resolve();
        });
      });
    }

    isStanza(element) {
      const {
        name
      } = element;
      const NS = element.attrs.xmlns;
      return (// This.online && FIXME
        (NS ? NS === this.NS : true) && (name === 'iq' || name === 'message' || name === 'presence')
      );
    }

    isNonza(element) {
      return !this.isStanza(element);
    } // Override


    header(el) {
      return el.toString();
    } // Override


    headerElement() {
      return new esm$2.Element('', {
        version: '1.0',
        xmlns: this.NS
      });
    } // Override


    footer(el) {
      return el.toString();
    } // Override


    footerElement() {} // Override


    socketParameters() {}

  } // Overrirde


  Connection.prototype.NS = '';
  Connection.prototype.Socket = null;
  Connection.prototype.Parser = null;
  var esm$4 = Connection;
  var socketConnect_1 = socketConnect;
  esm$4.socketConnect = socketConnect_1;

  class Client extends esm$4 {
    constructor(options) {
      super(options);
      this.transports = [];
    }

    send(element, ...args) {
      if (!element.attrs.xmlns && (element.is('iq') || element.is('message') || element.is('presence'))) {
        element.attrs.xmlns = 'jabber:client'; // FIXME no need for TCP/TLS transports
      }

      return super.send(element, ...args);
    }

    _findTransport(service) {
      return this.transports.find(Transport => {
        try {
          return Transport.prototype.socketParameters(service) !== undefined;
        } catch (err) {
          return false;
        }
      });
    }

    connect(service) {
      const Transport = this._findTransport(service);

      if (!Transport) {
        throw new Error('No compatible connection method found.');
      }

      this.Transport = Transport;
      this.Socket = Transport.prototype.Socket;
      this.Parser = Transport.prototype.Parser;
      return super.connect(service);
    }

    socketParameters(...args) {
      return this.Transport.prototype.socketParameters(...args);
    }

    header(...args) {
      return this.Transport.prototype.header(...args);
    }

    headerElement(...args) {
      return this.Transport.prototype.headerElement(...args);
    }

    footer(...args) {
      return this.Transport.prototype.footer(...args);
    }

    footerElement(...args) {
      return this.Transport.prototype.footerElement(...args);
    }

  }

  Client.prototype.NS = 'jabber:client';
  var Client_1 = Client;

  var Client_1$1 = Client_1;
  var xml_1 = esm$2;
  var jid_1 = esm$1;
  var esm$5 = {
    Client: Client_1$1,
    xml: xml_1,
    jid: jid_1
  };

  var getDomain = function getDomain(service) {
    const domain = service.split('://')[1] || service;
    return domain.split(':')[0].split('/')[0];
  };

  const {
    EventEmitter: EventEmitter$2
  } = esm;

  class Reconnect extends EventEmitter$2 {
    constructor(entity) {
      super();
      this.delay = 1000;
      this.entity = entity;
      this._timeout = null;
    }

    scheduleReconnect() {
      const {
        entity,
        delay,
        _timeout
      } = this;
      clearTimeout(_timeout);
      this._timeout = setTimeout(async () => {
        if (entity.status !== 'disconnect') {
          return;
        }

        try {
          await this.reconnect();
        } catch (err) {// Ignoring the rejection is safe because the error is emitted on entity by #start
        }
      }, delay);
    }

    async reconnect() {
      const {
        entity
      } = this;
      this.emit('reconnecting');
      const {
        service,
        domain,
        lang
      } = entity.options;
      await entity.connect(service);
      await entity.open({
        domain,
        lang
      });
      this.emit('reconnected');
    }

    start() {
      const {
        entity
      } = this;
      const listeners = {};

      listeners.disconnect = () => {
        this.scheduleReconnect();
      };

      this.listeners = listeners;
      entity.on('disconnect', listeners.disconnect);
    }

    stop() {
      const {
        entity,
        listeners,
        _timeout
      } = this;
      entity.removeListener('disconnect', listeners.disconnect);
      clearTimeout(_timeout);
    }

  }

  var esm$6 = function reconnect({
    entity
  }) {
    const r = new Reconnect(entity);
    r.start();
    return r;
  };

  var hasFetch = isFunction$1(global.fetch) && isFunction$1(global.ReadableStream);

  var _blobConstructor;

  function blobConstructor() {
    if (typeof _blobConstructor !== 'undefined') {
      return _blobConstructor;
    }

    try {
      new global.Blob([new ArrayBuffer(1)]);
      _blobConstructor = true;
    } catch (e) {
      _blobConstructor = false;
    }

    return _blobConstructor;
  }
  var xhr;

  function checkTypeSupport(type) {
    if (!xhr) {
      xhr = new global.XMLHttpRequest(); // If location.host is empty, e.g. if this page/worker was loaded
      // from a Blob, then use example.com to avoid an error

      xhr.open('GET', global.location.host ? '/' : 'https://example.com');
    }

    try {
      xhr.responseType = type;
      return xhr.responseType === type;
    } catch (e) {
      return false;
    }
  } // For some strange reason, Safari 7.0 reports typeof global.ArrayBuffer === 'object'.
  // Safari 7.1 appears to have fixed this bug.


  var haveArrayBuffer = typeof global.ArrayBuffer !== 'undefined';
  var haveSlice = haveArrayBuffer && isFunction$1(global.ArrayBuffer.prototype.slice);
  var arraybuffer = haveArrayBuffer && checkTypeSupport('arraybuffer'); // These next two tests unavoidably show warnings in Chrome. Since fetch will always
  // be used if it's available, just return false for these to avoid the warnings.

  var msstream = !hasFetch && haveSlice && checkTypeSupport('ms-stream');
  var mozchunkedarraybuffer = !hasFetch && haveArrayBuffer && checkTypeSupport('moz-chunked-arraybuffer');
  var overrideMimeType = isFunction$1(xhr.overrideMimeType);
  var vbArray = isFunction$1(global.VBArray);

  function isFunction$1(value) {
    return typeof value === 'function';
  }

  xhr = null; // Help gc

  var lookup = [];
  var revLookup = [];
  var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array;
  var inited = false;

  function init() {
    inited = true;
    var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

    for (var i = 0, len = code.length; i < len; ++i) {
      lookup[i] = code[i];
      revLookup[code.charCodeAt(i)] = i;
    }

    revLookup['-'.charCodeAt(0)] = 62;
    revLookup['_'.charCodeAt(0)] = 63;
  }

  function toByteArray(b64) {
    if (!inited) {
      init();
    }

    var i, j, l, tmp, placeHolders, arr;
    var len = b64.length;

    if (len % 4 > 0) {
      throw new Error('Invalid string. Length must be a multiple of 4');
    } // the number of equal signs (place holders)
    // if there are two placeholders, than the two characters before it
    // represent one byte
    // if there is only one, then the three characters before it represent 2 bytes
    // this is just a cheap hack to not do indexOf twice


    placeHolders = b64[len - 2] === '=' ? 2 : b64[len - 1] === '=' ? 1 : 0; // base64 is 4/3 + up to two characters of the original data

    arr = new Arr(len * 3 / 4 - placeHolders); // if there are placeholders, only get up to the last complete 4 chars

    l = placeHolders > 0 ? len - 4 : len;
    var L = 0;

    for (i = 0, j = 0; i < l; i += 4, j += 3) {
      tmp = revLookup[b64.charCodeAt(i)] << 18 | revLookup[b64.charCodeAt(i + 1)] << 12 | revLookup[b64.charCodeAt(i + 2)] << 6 | revLookup[b64.charCodeAt(i + 3)];
      arr[L++] = tmp >> 16 & 0xFF;
      arr[L++] = tmp >> 8 & 0xFF;
      arr[L++] = tmp & 0xFF;
    }

    if (placeHolders === 2) {
      tmp = revLookup[b64.charCodeAt(i)] << 2 | revLookup[b64.charCodeAt(i + 1)] >> 4;
      arr[L++] = tmp & 0xFF;
    } else if (placeHolders === 1) {
      tmp = revLookup[b64.charCodeAt(i)] << 10 | revLookup[b64.charCodeAt(i + 1)] << 4 | revLookup[b64.charCodeAt(i + 2)] >> 2;
      arr[L++] = tmp >> 8 & 0xFF;
      arr[L++] = tmp & 0xFF;
    }

    return arr;
  }

  function tripletToBase64(num) {
    return lookup[num >> 18 & 0x3F] + lookup[num >> 12 & 0x3F] + lookup[num >> 6 & 0x3F] + lookup[num & 0x3F];
  }

  function encodeChunk(uint8, start, end) {
    var tmp;
    var output = [];

    for (var i = start; i < end; i += 3) {
      tmp = (uint8[i] << 16) + (uint8[i + 1] << 8) + uint8[i + 2];
      output.push(tripletToBase64(tmp));
    }

    return output.join('');
  }

  function fromByteArray(uint8) {
    if (!inited) {
      init();
    }

    var tmp;
    var len = uint8.length;
    var extraBytes = len % 3; // if we have 1 byte left, pad 2 bytes

    var output = '';
    var parts = [];
    var maxChunkLength = 16383; // must be multiple of 3
    // go through the array every three bytes, we'll deal with trailing stuff later

    for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
      parts.push(encodeChunk(uint8, i, i + maxChunkLength > len2 ? len2 : i + maxChunkLength));
    } // pad the end with zeros, but make sure to not forget the extra bytes


    if (extraBytes === 1) {
      tmp = uint8[len - 1];
      output += lookup[tmp >> 2];
      output += lookup[tmp << 4 & 0x3F];
      output += '==';
    } else if (extraBytes === 2) {
      tmp = (uint8[len - 2] << 8) + uint8[len - 1];
      output += lookup[tmp >> 10];
      output += lookup[tmp >> 4 & 0x3F];
      output += lookup[tmp << 2 & 0x3F];
      output += '=';
    }

    parts.push(output);
    return parts.join('');
  }

  function read(buffer, offset, isLE, mLen, nBytes) {
    var e, m;
    var eLen = nBytes * 8 - mLen - 1;
    var eMax = (1 << eLen) - 1;
    var eBias = eMax >> 1;
    var nBits = -7;
    var i = isLE ? nBytes - 1 : 0;
    var d = isLE ? -1 : 1;
    var s = buffer[offset + i];
    i += d;
    e = s & (1 << -nBits) - 1;
    s >>= -nBits;
    nBits += eLen;

    for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8) {}

    m = e & (1 << -nBits) - 1;
    e >>= -nBits;
    nBits += mLen;

    for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8) {}

    if (e === 0) {
      e = 1 - eBias;
    } else if (e === eMax) {
      return m ? NaN : (s ? -1 : 1) * Infinity;
    } else {
      m = m + Math.pow(2, mLen);
      e = e - eBias;
    }

    return (s ? -1 : 1) * m * Math.pow(2, e - mLen);
  }
  function write(buffer, value, offset, isLE, mLen, nBytes) {
    var e, m, c;
    var eLen = nBytes * 8 - mLen - 1;
    var eMax = (1 << eLen) - 1;
    var eBias = eMax >> 1;
    var rt = mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0;
    var i = isLE ? 0 : nBytes - 1;
    var d = isLE ? 1 : -1;
    var s = value < 0 || value === 0 && 1 / value < 0 ? 1 : 0;
    value = Math.abs(value);

    if (isNaN(value) || value === Infinity) {
      m = isNaN(value) ? 1 : 0;
      e = eMax;
    } else {
      e = Math.floor(Math.log(value) / Math.LN2);

      if (value * (c = Math.pow(2, -e)) < 1) {
        e--;
        c *= 2;
      }

      if (e + eBias >= 1) {
        value += rt / c;
      } else {
        value += rt * Math.pow(2, 1 - eBias);
      }

      if (value * c >= 2) {
        e++;
        c /= 2;
      }

      if (e + eBias >= eMax) {
        m = 0;
        e = eMax;
      } else if (e + eBias >= 1) {
        m = (value * c - 1) * Math.pow(2, mLen);
        e = e + eBias;
      } else {
        m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen);
        e = 0;
      }
    }

    for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

    e = e << mLen | m;
    eLen += mLen;

    for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

    buffer[offset + i - d] |= s * 128;
  }

  var toString = {}.toString;
  var isArray$1 = Array.isArray || function (arr) {
    return toString.call(arr) == '[object Array]';
  };

  /*!
   * The buffer module from node.js, for the browser.
   *
   * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
   * @license  MIT
   */
  var INSPECT_MAX_BYTES = 50;
  /**
   * If `Buffer.TYPED_ARRAY_SUPPORT`:
   *   === true    Use Uint8Array implementation (fastest)
   *   === false   Use Object implementation (most compatible, even IE6)
   *
   * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
   * Opera 11.6+, iOS 4.2+.
   *
   * Due to various browser bugs, sometimes the Object implementation will be used even
   * when the browser supports typed arrays.
   *
   * Note:
   *
   *   - Firefox 4-29 lacks support for adding new properties to `Uint8Array` instances,
   *     See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438.
   *
   *   - Chrome 9-10 is missing the `TypedArray.prototype.subarray` function.
   *
   *   - IE10 has a broken `TypedArray.prototype.subarray` function which returns arrays of
   *     incorrect length in some situations.

   * We detect these buggy browsers and set `Buffer.TYPED_ARRAY_SUPPORT` to `false` so they
   * get the Object implementation, which is slower but behaves correctly.
   */

  Buffer$1.TYPED_ARRAY_SUPPORT = global.TYPED_ARRAY_SUPPORT !== undefined ? global.TYPED_ARRAY_SUPPORT : true;

  function kMaxLength() {
    return Buffer$1.TYPED_ARRAY_SUPPORT ? 0x7fffffff : 0x3fffffff;
  }

  function createBuffer(that, length) {
    if (kMaxLength() < length) {
      throw new RangeError('Invalid typed array length');
    }

    if (Buffer$1.TYPED_ARRAY_SUPPORT) {
      // Return an augmented `Uint8Array` instance, for best performance
      that = new Uint8Array(length);
      that.__proto__ = Buffer$1.prototype;
    } else {
      // Fallback: Return an object instance of the Buffer class
      if (that === null) {
        that = new Buffer$1(length);
      }

      that.length = length;
    }

    return that;
  }
  /**
   * The Buffer constructor returns instances of `Uint8Array` that have their
   * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
   * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
   * and the `Uint8Array` methods. Square bracket notation works as expected -- it
   * returns a single octet.
   *
   * The `Uint8Array` prototype remains unmodified.
   */


  function Buffer$1(arg, encodingOrOffset, length) {
    if (!Buffer$1.TYPED_ARRAY_SUPPORT && !(this instanceof Buffer$1)) {
      return new Buffer$1(arg, encodingOrOffset, length);
    } // Common case.


    if (typeof arg === 'number') {
      if (typeof encodingOrOffset === 'string') {
        throw new Error('If encoding is specified then the first argument must be a string');
      }

      return allocUnsafe(this, arg);
    }

    return from(this, arg, encodingOrOffset, length);
  }
  Buffer$1.poolSize = 8192; // not used by this implementation
  // TODO: Legacy, not needed anymore. Remove in next major version.

  Buffer$1._augment = function (arr) {
    arr.__proto__ = Buffer$1.prototype;
    return arr;
  };

  function from(that, value, encodingOrOffset, length) {
    if (typeof value === 'number') {
      throw new TypeError('"value" argument must not be a number');
    }

    if (typeof ArrayBuffer !== 'undefined' && value instanceof ArrayBuffer) {
      return fromArrayBuffer(that, value, encodingOrOffset, length);
    }

    if (typeof value === 'string') {
      return fromString(that, value, encodingOrOffset);
    }

    return fromObject(that, value);
  }
  /**
   * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
   * if value is a number.
   * Buffer.from(str[, encoding])
   * Buffer.from(array)
   * Buffer.from(buffer)
   * Buffer.from(arrayBuffer[, byteOffset[, length]])
   **/


  Buffer$1.from = function (value, encodingOrOffset, length) {
    return from(null, value, encodingOrOffset, length);
  };

  if (Buffer$1.TYPED_ARRAY_SUPPORT) {
    Buffer$1.prototype.__proto__ = Uint8Array.prototype;
    Buffer$1.__proto__ = Uint8Array;
  }

  function assertSize(size) {
    if (typeof size !== 'number') {
      throw new TypeError('"size" argument must be a number');
    } else if (size < 0) {
      throw new RangeError('"size" argument must not be negative');
    }
  }

  function alloc(that, size, fill, encoding) {
    assertSize(size);

    if (size <= 0) {
      return createBuffer(that, size);
    }

    if (fill !== undefined) {
      // Only pay attention to encoding if it's a string. This
      // prevents accidentally sending in a number that would
      // be interpretted as a start offset.
      return typeof encoding === 'string' ? createBuffer(that, size).fill(fill, encoding) : createBuffer(that, size).fill(fill);
    }

    return createBuffer(that, size);
  }
  /**
   * Creates a new filled Buffer instance.
   * alloc(size[, fill[, encoding]])
   **/


  Buffer$1.alloc = function (size, fill, encoding) {
    return alloc(null, size, fill, encoding);
  };

  function allocUnsafe(that, size) {
    assertSize(size);
    that = createBuffer(that, size < 0 ? 0 : checked(size) | 0);

    if (!Buffer$1.TYPED_ARRAY_SUPPORT) {
      for (var i = 0; i < size; ++i) {
        that[i] = 0;
      }
    }

    return that;
  }
  /**
   * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
   * */


  Buffer$1.allocUnsafe = function (size) {
    return allocUnsafe(null, size);
  };
  /**
   * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
   */


  Buffer$1.allocUnsafeSlow = function (size) {
    return allocUnsafe(null, size);
  };

  function fromString(that, string, encoding) {
    if (typeof encoding !== 'string' || encoding === '') {
      encoding = 'utf8';
    }

    if (!Buffer$1.isEncoding(encoding)) {
      throw new TypeError('"encoding" must be a valid string encoding');
    }

    var length = byteLength(string, encoding) | 0;
    that = createBuffer(that, length);
    var actual = that.write(string, encoding);

    if (actual !== length) {
      // Writing a hex string, for example, that contains invalid characters will
      // cause everything after the first invalid character to be ignored. (e.g.
      // 'abxxcd' will be treated as 'ab')
      that = that.slice(0, actual);
    }

    return that;
  }

  function fromArrayLike(that, array) {
    var length = array.length < 0 ? 0 : checked(array.length) | 0;
    that = createBuffer(that, length);

    for (var i = 0; i < length; i += 1) {
      that[i] = array[i] & 255;
    }

    return that;
  }

  function fromArrayBuffer(that, array, byteOffset, length) {
    array.byteLength; // this throws if `array` is not a valid ArrayBuffer

    if (byteOffset < 0 || array.byteLength < byteOffset) {
      throw new RangeError('\'offset\' is out of bounds');
    }

    if (array.byteLength < byteOffset + (length || 0)) {
      throw new RangeError('\'length\' is out of bounds');
    }

    if (byteOffset === undefined && length === undefined) {
      array = new Uint8Array(array);
    } else if (length === undefined) {
      array = new Uint8Array(array, byteOffset);
    } else {
      array = new Uint8Array(array, byteOffset, length);
    }

    if (Buffer$1.TYPED_ARRAY_SUPPORT) {
      // Return an augmented `Uint8Array` instance, for best performance
      that = array;
      that.__proto__ = Buffer$1.prototype;
    } else {
      // Fallback: Return an object instance of the Buffer class
      that = fromArrayLike(that, array);
    }

    return that;
  }

  function fromObject(that, obj) {
    if (internalIsBuffer(obj)) {
      var len = checked(obj.length) | 0;
      that = createBuffer(that, len);

      if (that.length === 0) {
        return that;
      }

      obj.copy(that, 0, 0, len);
      return that;
    }

    if (obj) {
      if (typeof ArrayBuffer !== 'undefined' && obj.buffer instanceof ArrayBuffer || 'length' in obj) {
        if (typeof obj.length !== 'number' || isnan(obj.length)) {
          return createBuffer(that, 0);
        }

        return fromArrayLike(that, obj);
      }

      if (obj.type === 'Buffer' && isArray$1(obj.data)) {
        return fromArrayLike(that, obj.data);
      }
    }

    throw new TypeError('First argument must be a string, Buffer, ArrayBuffer, Array, or array-like object.');
  }

  function checked(length) {
    // Note: cannot use `length < kMaxLength()` here because that fails when
    // length is NaN (which is otherwise coerced to zero.)
    if (length >= kMaxLength()) {
      throw new RangeError('Attempt to allocate Buffer larger than maximum ' + 'size: 0x' + kMaxLength().toString(16) + ' bytes');
    }

    return length | 0;
  }
  Buffer$1.isBuffer = isBuffer$1;

  function internalIsBuffer(b) {
    return !!(b != null && b._isBuffer);
  }

  Buffer$1.compare = function compare(a, b) {
    if (!internalIsBuffer(a) || !internalIsBuffer(b)) {
      throw new TypeError('Arguments must be Buffers');
    }

    if (a === b) return 0;
    var x = a.length;
    var y = b.length;

    for (var i = 0, len = Math.min(x, y); i < len; ++i) {
      if (a[i] !== b[i]) {
        x = a[i];
        y = b[i];
        break;
      }
    }

    if (x < y) return -1;
    if (y < x) return 1;
    return 0;
  };

  Buffer$1.isEncoding = function isEncoding(encoding) {
    switch (String(encoding).toLowerCase()) {
      case 'hex':
      case 'utf8':
      case 'utf-8':
      case 'ascii':
      case 'latin1':
      case 'binary':
      case 'base64':
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return true;

      default:
        return false;
    }
  };

  Buffer$1.concat = function concat(list, length) {
    if (!isArray$1(list)) {
      throw new TypeError('"list" argument must be an Array of Buffers');
    }

    if (list.length === 0) {
      return Buffer$1.alloc(0);
    }

    var i;

    if (length === undefined) {
      length = 0;

      for (i = 0; i < list.length; ++i) {
        length += list[i].length;
      }
    }

    var buffer = Buffer$1.allocUnsafe(length);
    var pos = 0;

    for (i = 0; i < list.length; ++i) {
      var buf = list[i];

      if (!internalIsBuffer(buf)) {
        throw new TypeError('"list" argument must be an Array of Buffers');
      }

      buf.copy(buffer, pos);
      pos += buf.length;
    }

    return buffer;
  };

  function byteLength(string, encoding) {
    if (internalIsBuffer(string)) {
      return string.length;
    }

    if (typeof ArrayBuffer !== 'undefined' && typeof ArrayBuffer.isView === 'function' && (ArrayBuffer.isView(string) || string instanceof ArrayBuffer)) {
      return string.byteLength;
    }

    if (typeof string !== 'string') {
      string = '' + string;
    }

    var len = string.length;
    if (len === 0) return 0; // Use a for loop to avoid recursion

    var loweredCase = false;

    for (;;) {
      switch (encoding) {
        case 'ascii':
        case 'latin1':
        case 'binary':
          return len;

        case 'utf8':
        case 'utf-8':
        case undefined:
          return utf8ToBytes(string).length;

        case 'ucs2':
        case 'ucs-2':
        case 'utf16le':
        case 'utf-16le':
          return len * 2;

        case 'hex':
          return len >>> 1;

        case 'base64':
          return base64ToBytes(string).length;

        default:
          if (loweredCase) return utf8ToBytes(string).length; // assume utf8

          encoding = ('' + encoding).toLowerCase();
          loweredCase = true;
      }
    }
  }

  Buffer$1.byteLength = byteLength;

  function slowToString(encoding, start, end) {
    var loweredCase = false; // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
    // property of a typed array.
    // This behaves neither like String nor Uint8Array in that we set start/end
    // to their upper/lower bounds if the value passed is out of range.
    // undefined is handled specially as per ECMA-262 6th Edition,
    // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.

    if (start === undefined || start < 0) {
      start = 0;
    } // Return early if start > this.length. Done here to prevent potential uint32
    // coercion fail below.


    if (start > this.length) {
      return '';
    }

    if (end === undefined || end > this.length) {
      end = this.length;
    }

    if (end <= 0) {
      return '';
    } // Force coersion to uint32. This will also coerce falsey/NaN values to 0.


    end >>>= 0;
    start >>>= 0;

    if (end <= start) {
      return '';
    }

    if (!encoding) encoding = 'utf8';

    while (true) {
      switch (encoding) {
        case 'hex':
          return hexSlice(this, start, end);

        case 'utf8':
        case 'utf-8':
          return utf8Slice(this, start, end);

        case 'ascii':
          return asciiSlice(this, start, end);

        case 'latin1':
        case 'binary':
          return latin1Slice(this, start, end);

        case 'base64':
          return base64Slice(this, start, end);

        case 'ucs2':
        case 'ucs-2':
        case 'utf16le':
        case 'utf-16le':
          return utf16leSlice(this, start, end);

        default:
          if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding);
          encoding = (encoding + '').toLowerCase();
          loweredCase = true;
      }
    }
  } // The property is used by `Buffer.isBuffer` and `is-buffer` (in Safari 5-7) to detect
  // Buffer instances.


  Buffer$1.prototype._isBuffer = true;

  function swap(b, n, m) {
    var i = b[n];
    b[n] = b[m];
    b[m] = i;
  }

  Buffer$1.prototype.swap16 = function swap16() {
    var len = this.length;

    if (len % 2 !== 0) {
      throw new RangeError('Buffer size must be a multiple of 16-bits');
    }

    for (var i = 0; i < len; i += 2) {
      swap(this, i, i + 1);
    }

    return this;
  };

  Buffer$1.prototype.swap32 = function swap32() {
    var len = this.length;

    if (len % 4 !== 0) {
      throw new RangeError('Buffer size must be a multiple of 32-bits');
    }

    for (var i = 0; i < len; i += 4) {
      swap(this, i, i + 3);
      swap(this, i + 1, i + 2);
    }

    return this;
  };

  Buffer$1.prototype.swap64 = function swap64() {
    var len = this.length;

    if (len % 8 !== 0) {
      throw new RangeError('Buffer size must be a multiple of 64-bits');
    }

    for (var i = 0; i < len; i += 8) {
      swap(this, i, i + 7);
      swap(this, i + 1, i + 6);
      swap(this, i + 2, i + 5);
      swap(this, i + 3, i + 4);
    }

    return this;
  };

  Buffer$1.prototype.toString = function toString() {
    var length = this.length | 0;
    if (length === 0) return '';
    if (arguments.length === 0) return utf8Slice(this, 0, length);
    return slowToString.apply(this, arguments);
  };

  Buffer$1.prototype.equals = function equals(b) {
    if (!internalIsBuffer(b)) throw new TypeError('Argument must be a Buffer');
    if (this === b) return true;
    return Buffer$1.compare(this, b) === 0;
  };

  Buffer$1.prototype.inspect = function inspect() {
    var str = '';
    var max = INSPECT_MAX_BYTES;

    if (this.length > 0) {
      str = this.toString('hex', 0, max).match(/.{2}/g).join(' ');
      if (this.length > max) str += ' ... ';
    }

    return '<Buffer ' + str + '>';
  };

  Buffer$1.prototype.compare = function compare(target, start, end, thisStart, thisEnd) {
    if (!internalIsBuffer(target)) {
      throw new TypeError('Argument must be a Buffer');
    }

    if (start === undefined) {
      start = 0;
    }

    if (end === undefined) {
      end = target ? target.length : 0;
    }

    if (thisStart === undefined) {
      thisStart = 0;
    }

    if (thisEnd === undefined) {
      thisEnd = this.length;
    }

    if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
      throw new RangeError('out of range index');
    }

    if (thisStart >= thisEnd && start >= end) {
      return 0;
    }

    if (thisStart >= thisEnd) {
      return -1;
    }

    if (start >= end) {
      return 1;
    }

    start >>>= 0;
    end >>>= 0;
    thisStart >>>= 0;
    thisEnd >>>= 0;
    if (this === target) return 0;
    var x = thisEnd - thisStart;
    var y = end - start;
    var len = Math.min(x, y);
    var thisCopy = this.slice(thisStart, thisEnd);
    var targetCopy = target.slice(start, end);

    for (var i = 0; i < len; ++i) {
      if (thisCopy[i] !== targetCopy[i]) {
        x = thisCopy[i];
        y = targetCopy[i];
        break;
      }
    }

    if (x < y) return -1;
    if (y < x) return 1;
    return 0;
  }; // Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
  // OR the last index of `val` in `buffer` at offset <= `byteOffset`.
  //
  // Arguments:
  // - buffer - a Buffer to search
  // - val - a string, Buffer, or number
  // - byteOffset - an index into `buffer`; will be clamped to an int32
  // - encoding - an optional encoding, relevant is val is a string
  // - dir - true for indexOf, false for lastIndexOf


  function bidirectionalIndexOf(buffer, val, byteOffset, encoding, dir) {
    // Empty buffer means no match
    if (buffer.length === 0) return -1; // Normalize byteOffset

    if (typeof byteOffset === 'string') {
      encoding = byteOffset;
      byteOffset = 0;
    } else if (byteOffset > 0x7fffffff) {
      byteOffset = 0x7fffffff;
    } else if (byteOffset < -0x80000000) {
      byteOffset = -0x80000000;
    }

    byteOffset = +byteOffset; // Coerce to Number.

    if (isNaN(byteOffset)) {
      // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
      byteOffset = dir ? 0 : buffer.length - 1;
    } // Normalize byteOffset: negative offsets start from the end of the buffer


    if (byteOffset < 0) byteOffset = buffer.length + byteOffset;

    if (byteOffset >= buffer.length) {
      if (dir) return -1;else byteOffset = buffer.length - 1;
    } else if (byteOffset < 0) {
      if (dir) byteOffset = 0;else return -1;
    } // Normalize val


    if (typeof val === 'string') {
      val = Buffer$1.from(val, encoding);
    } // Finally, search either indexOf (if dir is true) or lastIndexOf


    if (internalIsBuffer(val)) {
      // Special case: looking for empty string/buffer always fails
      if (val.length === 0) {
        return -1;
      }

      return arrayIndexOf(buffer, val, byteOffset, encoding, dir);
    } else if (typeof val === 'number') {
      val = val & 0xFF; // Search for a byte value [0-255]

      if (Buffer$1.TYPED_ARRAY_SUPPORT && typeof Uint8Array.prototype.indexOf === 'function') {
        if (dir) {
          return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset);
        } else {
          return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset);
        }
      }

      return arrayIndexOf(buffer, [val], byteOffset, encoding, dir);
    }

    throw new TypeError('val must be string, number or Buffer');
  }

  function arrayIndexOf(arr, val, byteOffset, encoding, dir) {
    var indexSize = 1;
    var arrLength = arr.length;
    var valLength = val.length;

    if (encoding !== undefined) {
      encoding = String(encoding).toLowerCase();

      if (encoding === 'ucs2' || encoding === 'ucs-2' || encoding === 'utf16le' || encoding === 'utf-16le') {
        if (arr.length < 2 || val.length < 2) {
          return -1;
        }

        indexSize = 2;
        arrLength /= 2;
        valLength /= 2;
        byteOffset /= 2;
      }
    }

    function read(buf, i) {
      if (indexSize === 1) {
        return buf[i];
      } else {
        return buf.readUInt16BE(i * indexSize);
      }
    }

    var i;

    if (dir) {
      var foundIndex = -1;

      for (i = byteOffset; i < arrLength; i++) {
        if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
          if (foundIndex === -1) foundIndex = i;
          if (i - foundIndex + 1 === valLength) return foundIndex * indexSize;
        } else {
          if (foundIndex !== -1) i -= i - foundIndex;
          foundIndex = -1;
        }
      }
    } else {
      if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength;

      for (i = byteOffset; i >= 0; i--) {
        var found = true;

        for (var j = 0; j < valLength; j++) {
          if (read(arr, i + j) !== read(val, j)) {
            found = false;
            break;
          }
        }

        if (found) return i;
      }
    }

    return -1;
  }

  Buffer$1.prototype.includes = function includes(val, byteOffset, encoding) {
    return this.indexOf(val, byteOffset, encoding) !== -1;
  };

  Buffer$1.prototype.indexOf = function indexOf(val, byteOffset, encoding) {
    return bidirectionalIndexOf(this, val, byteOffset, encoding, true);
  };

  Buffer$1.prototype.lastIndexOf = function lastIndexOf(val, byteOffset, encoding) {
    return bidirectionalIndexOf(this, val, byteOffset, encoding, false);
  };

  function hexWrite(buf, string, offset, length) {
    offset = Number(offset) || 0;
    var remaining = buf.length - offset;

    if (!length) {
      length = remaining;
    } else {
      length = Number(length);

      if (length > remaining) {
        length = remaining;
      }
    } // must be an even number of digits


    var strLen = string.length;
    if (strLen % 2 !== 0) throw new TypeError('Invalid hex string');

    if (length > strLen / 2) {
      length = strLen / 2;
    }

    for (var i = 0; i < length; ++i) {
      var parsed = parseInt(string.substr(i * 2, 2), 16);
      if (isNaN(parsed)) return i;
      buf[offset + i] = parsed;
    }

    return i;
  }

  function utf8Write(buf, string, offset, length) {
    return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length);
  }

  function asciiWrite(buf, string, offset, length) {
    return blitBuffer(asciiToBytes(string), buf, offset, length);
  }

  function latin1Write(buf, string, offset, length) {
    return asciiWrite(buf, string, offset, length);
  }

  function base64Write(buf, string, offset, length) {
    return blitBuffer(base64ToBytes(string), buf, offset, length);
  }

  function ucs2Write(buf, string, offset, length) {
    return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length);
  }

  Buffer$1.prototype.write = function write(string, offset, length, encoding) {
    // Buffer#write(string)
    if (offset === undefined) {
      encoding = 'utf8';
      length = this.length;
      offset = 0; // Buffer#write(string, encoding)
    } else if (length === undefined && typeof offset === 'string') {
      encoding = offset;
      length = this.length;
      offset = 0; // Buffer#write(string, offset[, length][, encoding])
    } else if (isFinite(offset)) {
      offset = offset | 0;

      if (isFinite(length)) {
        length = length | 0;
        if (encoding === undefined) encoding = 'utf8';
      } else {
        encoding = length;
        length = undefined;
      } // legacy write(string, encoding, offset, length) - remove in v0.13

    } else {
      throw new Error('Buffer.write(string, encoding, offset[, length]) is no longer supported');
    }

    var remaining = this.length - offset;
    if (length === undefined || length > remaining) length = remaining;

    if (string.length > 0 && (length < 0 || offset < 0) || offset > this.length) {
      throw new RangeError('Attempt to write outside buffer bounds');
    }

    if (!encoding) encoding = 'utf8';
    var loweredCase = false;

    for (;;) {
      switch (encoding) {
        case 'hex':
          return hexWrite(this, string, offset, length);

        case 'utf8':
        case 'utf-8':
          return utf8Write(this, string, offset, length);

        case 'ascii':
          return asciiWrite(this, string, offset, length);

        case 'latin1':
        case 'binary':
          return latin1Write(this, string, offset, length);

        case 'base64':
          // Warning: maxLength not taken into account in base64Write
          return base64Write(this, string, offset, length);

        case 'ucs2':
        case 'ucs-2':
        case 'utf16le':
        case 'utf-16le':
          return ucs2Write(this, string, offset, length);

        default:
          if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding);
          encoding = ('' + encoding).toLowerCase();
          loweredCase = true;
      }
    }
  };

  Buffer$1.prototype.toJSON = function toJSON() {
    return {
      type: 'Buffer',
      data: Array.prototype.slice.call(this._arr || this, 0)
    };
  };

  function base64Slice(buf, start, end) {
    if (start === 0 && end === buf.length) {
      return fromByteArray(buf);
    } else {
      return fromByteArray(buf.slice(start, end));
    }
  }

  function utf8Slice(buf, start, end) {
    end = Math.min(buf.length, end);
    var res = [];
    var i = start;

    while (i < end) {
      var firstByte = buf[i];
      var codePoint = null;
      var bytesPerSequence = firstByte > 0xEF ? 4 : firstByte > 0xDF ? 3 : firstByte > 0xBF ? 2 : 1;

      if (i + bytesPerSequence <= end) {
        var secondByte, thirdByte, fourthByte, tempCodePoint;

        switch (bytesPerSequence) {
          case 1:
            if (firstByte < 0x80) {
              codePoint = firstByte;
            }

            break;

          case 2:
            secondByte = buf[i + 1];

            if ((secondByte & 0xC0) === 0x80) {
              tempCodePoint = (firstByte & 0x1F) << 0x6 | secondByte & 0x3F;

              if (tempCodePoint > 0x7F) {
                codePoint = tempCodePoint;
              }
            }

            break;

          case 3:
            secondByte = buf[i + 1];
            thirdByte = buf[i + 2];

            if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
              tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | thirdByte & 0x3F;

              if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
                codePoint = tempCodePoint;
              }
            }

            break;

          case 4:
            secondByte = buf[i + 1];
            thirdByte = buf[i + 2];
            fourthByte = buf[i + 3];

            if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
              tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | fourthByte & 0x3F;

              if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
                codePoint = tempCodePoint;
              }
            }

        }
      }

      if (codePoint === null) {
        // we did not generate a valid codePoint so insert a
        // replacement char (U+FFFD) and advance only 1 byte
        codePoint = 0xFFFD;
        bytesPerSequence = 1;
      } else if (codePoint > 0xFFFF) {
        // encode to utf16 (surrogate pair dance)
        codePoint -= 0x10000;
        res.push(codePoint >>> 10 & 0x3FF | 0xD800);
        codePoint = 0xDC00 | codePoint & 0x3FF;
      }

      res.push(codePoint);
      i += bytesPerSequence;
    }

    return decodeCodePointsArray(res);
  } // Based on http://stackoverflow.com/a/22747272/680742, the browser with
  // the lowest limit is Chrome, with 0x10000 args.
  // We go 1 magnitude less, for safety


  var MAX_ARGUMENTS_LENGTH = 0x1000;

  function decodeCodePointsArray(codePoints) {
    var len = codePoints.length;

    if (len <= MAX_ARGUMENTS_LENGTH) {
      return String.fromCharCode.apply(String, codePoints); // avoid extra slice()
    } // Decode in chunks to avoid "call stack size exceeded".


    var res = '';
    var i = 0;

    while (i < len) {
      res += String.fromCharCode.apply(String, codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH));
    }

    return res;
  }

  function asciiSlice(buf, start, end) {
    var ret = '';
    end = Math.min(buf.length, end);

    for (var i = start; i < end; ++i) {
      ret += String.fromCharCode(buf[i] & 0x7F);
    }

    return ret;
  }

  function latin1Slice(buf, start, end) {
    var ret = '';
    end = Math.min(buf.length, end);

    for (var i = start; i < end; ++i) {
      ret += String.fromCharCode(buf[i]);
    }

    return ret;
  }

  function hexSlice(buf, start, end) {
    var len = buf.length;
    if (!start || start < 0) start = 0;
    if (!end || end < 0 || end > len) end = len;
    var out = '';

    for (var i = start; i < end; ++i) {
      out += toHex(buf[i]);
    }

    return out;
  }

  function utf16leSlice(buf, start, end) {
    var bytes = buf.slice(start, end);
    var res = '';

    for (var i = 0; i < bytes.length; i += 2) {
      res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256);
    }

    return res;
  }

  Buffer$1.prototype.slice = function slice(start, end) {
    var len = this.length;
    start = ~~start;
    end = end === undefined ? len : ~~end;

    if (start < 0) {
      start += len;
      if (start < 0) start = 0;
    } else if (start > len) {
      start = len;
    }

    if (end < 0) {
      end += len;
      if (end < 0) end = 0;
    } else if (end > len) {
      end = len;
    }

    if (end < start) end = start;
    var newBuf;

    if (Buffer$1.TYPED_ARRAY_SUPPORT) {
      newBuf = this.subarray(start, end);
      newBuf.__proto__ = Buffer$1.prototype;
    } else {
      var sliceLen = end - start;
      newBuf = new Buffer$1(sliceLen, undefined);

      for (var i = 0; i < sliceLen; ++i) {
        newBuf[i] = this[i + start];
      }
    }

    return newBuf;
  };
  /*
   * Need to make sure that buffer isn't trying to write out of bounds.
   */


  function checkOffset(offset, ext, length) {
    if (offset % 1 !== 0 || offset < 0) throw new RangeError('offset is not uint');
    if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length');
  }

  Buffer$1.prototype.readUIntLE = function readUIntLE(offset, byteLength, noAssert) {
    offset = offset | 0;
    byteLength = byteLength | 0;
    if (!noAssert) checkOffset(offset, byteLength, this.length);
    var val = this[offset];
    var mul = 1;
    var i = 0;

    while (++i < byteLength && (mul *= 0x100)) {
      val += this[offset + i] * mul;
    }

    return val;
  };

  Buffer$1.prototype.readUIntBE = function readUIntBE(offset, byteLength, noAssert) {
    offset = offset | 0;
    byteLength = byteLength | 0;

    if (!noAssert) {
      checkOffset(offset, byteLength, this.length);
    }

    var val = this[offset + --byteLength];
    var mul = 1;

    while (byteLength > 0 && (mul *= 0x100)) {
      val += this[offset + --byteLength] * mul;
    }

    return val;
  };

  Buffer$1.prototype.readUInt8 = function readUInt8(offset, noAssert) {
    if (!noAssert) checkOffset(offset, 1, this.length);
    return this[offset];
  };

  Buffer$1.prototype.readUInt16LE = function readUInt16LE(offset, noAssert) {
    if (!noAssert) checkOffset(offset, 2, this.length);
    return this[offset] | this[offset + 1] << 8;
  };

  Buffer$1.prototype.readUInt16BE = function readUInt16BE(offset, noAssert) {
    if (!noAssert) checkOffset(offset, 2, this.length);
    return this[offset] << 8 | this[offset + 1];
  };

  Buffer$1.prototype.readUInt32LE = function readUInt32LE(offset, noAssert) {
    if (!noAssert) checkOffset(offset, 4, this.length);
    return (this[offset] | this[offset + 1] << 8 | this[offset + 2] << 16) + this[offset + 3] * 0x1000000;
  };

  Buffer$1.prototype.readUInt32BE = function readUInt32BE(offset, noAssert) {
    if (!noAssert) checkOffset(offset, 4, this.length);
    return this[offset] * 0x1000000 + (this[offset + 1] << 16 | this[offset + 2] << 8 | this[offset + 3]);
  };

  Buffer$1.prototype.readIntLE = function readIntLE(offset, byteLength, noAssert) {
    offset = offset | 0;
    byteLength = byteLength | 0;
    if (!noAssert) checkOffset(offset, byteLength, this.length);
    var val = this[offset];
    var mul = 1;
    var i = 0;

    while (++i < byteLength && (mul *= 0x100)) {
      val += this[offset + i] * mul;
    }

    mul *= 0x80;
    if (val >= mul) val -= Math.pow(2, 8 * byteLength);
    return val;
  };

  Buffer$1.prototype.readIntBE = function readIntBE(offset, byteLength, noAssert) {
    offset = offset | 0;
    byteLength = byteLength | 0;
    if (!noAssert) checkOffset(offset, byteLength, this.length);
    var i = byteLength;
    var mul = 1;
    var val = this[offset + --i];

    while (i > 0 && (mul *= 0x100)) {
      val += this[offset + --i] * mul;
    }

    mul *= 0x80;
    if (val >= mul) val -= Math.pow(2, 8 * byteLength);
    return val;
  };

  Buffer$1.prototype.readInt8 = function readInt8(offset, noAssert) {
    if (!noAssert) checkOffset(offset, 1, this.length);
    if (!(this[offset] & 0x80)) return this[offset];
    return (0xff - this[offset] + 1) * -1;
  };

  Buffer$1.prototype.readInt16LE = function readInt16LE(offset, noAssert) {
    if (!noAssert) checkOffset(offset, 2, this.length);
    var val = this[offset] | this[offset + 1] << 8;
    return val & 0x8000 ? val | 0xFFFF0000 : val;
  };

  Buffer$1.prototype.readInt16BE = function readInt16BE(offset, noAssert) {
    if (!noAssert) checkOffset(offset, 2, this.length);
    var val = this[offset + 1] | this[offset] << 8;
    return val & 0x8000 ? val | 0xFFFF0000 : val;
  };

  Buffer$1.prototype.readInt32LE = function readInt32LE(offset, noAssert) {
    if (!noAssert) checkOffset(offset, 4, this.length);
    return this[offset] | this[offset + 1] << 8 | this[offset + 2] << 16 | this[offset + 3] << 24;
  };

  Buffer$1.prototype.readInt32BE = function readInt32BE(offset, noAssert) {
    if (!noAssert) checkOffset(offset, 4, this.length);
    return this[offset] << 24 | this[offset + 1] << 16 | this[offset + 2] << 8 | this[offset + 3];
  };

  Buffer$1.prototype.readFloatLE = function readFloatLE(offset, noAssert) {
    if (!noAssert) checkOffset(offset, 4, this.length);
    return read(this, offset, true, 23, 4);
  };

  Buffer$1.prototype.readFloatBE = function readFloatBE(offset, noAssert) {
    if (!noAssert) checkOffset(offset, 4, this.length);
    return read(this, offset, false, 23, 4);
  };

  Buffer$1.prototype.readDoubleLE = function readDoubleLE(offset, noAssert) {
    if (!noAssert) checkOffset(offset, 8, this.length);
    return read(this, offset, true, 52, 8);
  };

  Buffer$1.prototype.readDoubleBE = function readDoubleBE(offset, noAssert) {
    if (!noAssert) checkOffset(offset, 8, this.length);
    return read(this, offset, false, 52, 8);
  };

  function checkInt(buf, value, offset, ext, max, min) {
    if (!internalIsBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance');
    if (value > max || value < min) throw new RangeError('"value" argument is out of bounds');
    if (offset + ext > buf.length) throw new RangeError('Index out of range');
  }

  Buffer$1.prototype.writeUIntLE = function writeUIntLE(value, offset, byteLength, noAssert) {
    value = +value;
    offset = offset | 0;
    byteLength = byteLength | 0;

    if (!noAssert) {
      var maxBytes = Math.pow(2, 8 * byteLength) - 1;
      checkInt(this, value, offset, byteLength, maxBytes, 0);
    }

    var mul = 1;
    var i = 0;
    this[offset] = value & 0xFF;

    while (++i < byteLength && (mul *= 0x100)) {
      this[offset + i] = value / mul & 0xFF;
    }

    return offset + byteLength;
  };

  Buffer$1.prototype.writeUIntBE = function writeUIntBE(value, offset, byteLength, noAssert) {
    value = +value;
    offset = offset | 0;
    byteLength = byteLength | 0;

    if (!noAssert) {
      var maxBytes = Math.pow(2, 8 * byteLength) - 1;
      checkInt(this, value, offset, byteLength, maxBytes, 0);
    }

    var i = byteLength - 1;
    var mul = 1;
    this[offset + i] = value & 0xFF;

    while (--i >= 0 && (mul *= 0x100)) {
      this[offset + i] = value / mul & 0xFF;
    }

    return offset + byteLength;
  };

  Buffer$1.prototype.writeUInt8 = function writeUInt8(value, offset, noAssert) {
    value = +value;
    offset = offset | 0;
    if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0);
    if (!Buffer$1.TYPED_ARRAY_SUPPORT) value = Math.floor(value);
    this[offset] = value & 0xff;
    return offset + 1;
  };

  function objectWriteUInt16(buf, value, offset, littleEndian) {
    if (value < 0) value = 0xffff + value + 1;

    for (var i = 0, j = Math.min(buf.length - offset, 2); i < j; ++i) {
      buf[offset + i] = (value & 0xff << 8 * (littleEndian ? i : 1 - i)) >>> (littleEndian ? i : 1 - i) * 8;
    }
  }

  Buffer$1.prototype.writeUInt16LE = function writeUInt16LE(value, offset, noAssert) {
    value = +value;
    offset = offset | 0;
    if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0);

    if (Buffer$1.TYPED_ARRAY_SUPPORT) {
      this[offset] = value & 0xff;
      this[offset + 1] = value >>> 8;
    } else {
      objectWriteUInt16(this, value, offset, true);
    }

    return offset + 2;
  };

  Buffer$1.prototype.writeUInt16BE = function writeUInt16BE(value, offset, noAssert) {
    value = +value;
    offset = offset | 0;
    if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0);

    if (Buffer$1.TYPED_ARRAY_SUPPORT) {
      this[offset] = value >>> 8;
      this[offset + 1] = value & 0xff;
    } else {
      objectWriteUInt16(this, value, offset, false);
    }

    return offset + 2;
  };

  function objectWriteUInt32(buf, value, offset, littleEndian) {
    if (value < 0) value = 0xffffffff + value + 1;

    for (var i = 0, j = Math.min(buf.length - offset, 4); i < j; ++i) {
      buf[offset + i] = value >>> (littleEndian ? i : 3 - i) * 8 & 0xff;
    }
  }

  Buffer$1.prototype.writeUInt32LE = function writeUInt32LE(value, offset, noAssert) {
    value = +value;
    offset = offset | 0;
    if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0);

    if (Buffer$1.TYPED_ARRAY_SUPPORT) {
      this[offset + 3] = value >>> 24;
      this[offset + 2] = value >>> 16;
      this[offset + 1] = value >>> 8;
      this[offset] = value & 0xff;
    } else {
      objectWriteUInt32(this, value, offset, true);
    }

    return offset + 4;
  };

  Buffer$1.prototype.writeUInt32BE = function writeUInt32BE(value, offset, noAssert) {
    value = +value;
    offset = offset | 0;
    if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0);

    if (Buffer$1.TYPED_ARRAY_SUPPORT) {
      this[offset] = value >>> 24;
      this[offset + 1] = value >>> 16;
      this[offset + 2] = value >>> 8;
      this[offset + 3] = value & 0xff;
    } else {
      objectWriteUInt32(this, value, offset, false);
    }

    return offset + 4;
  };

  Buffer$1.prototype.writeIntLE = function writeIntLE(value, offset, byteLength, noAssert) {
    value = +value;
    offset = offset | 0;

    if (!noAssert) {
      var limit = Math.pow(2, 8 * byteLength - 1);
      checkInt(this, value, offset, byteLength, limit - 1, -limit);
    }

    var i = 0;
    var mul = 1;
    var sub = 0;
    this[offset] = value & 0xFF;

    while (++i < byteLength && (mul *= 0x100)) {
      if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
        sub = 1;
      }

      this[offset + i] = (value / mul >> 0) - sub & 0xFF;
    }

    return offset + byteLength;
  };

  Buffer$1.prototype.writeIntBE = function writeIntBE(value, offset, byteLength, noAssert) {
    value = +value;
    offset = offset | 0;

    if (!noAssert) {
      var limit = Math.pow(2, 8 * byteLength - 1);
      checkInt(this, value, offset, byteLength, limit - 1, -limit);
    }

    var i = byteLength - 1;
    var mul = 1;
    var sub = 0;
    this[offset + i] = value & 0xFF;

    while (--i >= 0 && (mul *= 0x100)) {
      if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
        sub = 1;
      }

      this[offset + i] = (value / mul >> 0) - sub & 0xFF;
    }

    return offset + byteLength;
  };

  Buffer$1.prototype.writeInt8 = function writeInt8(value, offset, noAssert) {
    value = +value;
    offset = offset | 0;
    if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80);
    if (!Buffer$1.TYPED_ARRAY_SUPPORT) value = Math.floor(value);
    if (value < 0) value = 0xff + value + 1;
    this[offset] = value & 0xff;
    return offset + 1;
  };

  Buffer$1.prototype.writeInt16LE = function writeInt16LE(value, offset, noAssert) {
    value = +value;
    offset = offset | 0;
    if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000);

    if (Buffer$1.TYPED_ARRAY_SUPPORT) {
      this[offset] = value & 0xff;
      this[offset + 1] = value >>> 8;
    } else {
      objectWriteUInt16(this, value, offset, true);
    }

    return offset + 2;
  };

  Buffer$1.prototype.writeInt16BE = function writeInt16BE(value, offset, noAssert) {
    value = +value;
    offset = offset | 0;
    if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000);

    if (Buffer$1.TYPED_ARRAY_SUPPORT) {
      this[offset] = value >>> 8;
      this[offset + 1] = value & 0xff;
    } else {
      objectWriteUInt16(this, value, offset, false);
    }

    return offset + 2;
  };

  Buffer$1.prototype.writeInt32LE = function writeInt32LE(value, offset, noAssert) {
    value = +value;
    offset = offset | 0;
    if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000);

    if (Buffer$1.TYPED_ARRAY_SUPPORT) {
      this[offset] = value & 0xff;
      this[offset + 1] = value >>> 8;
      this[offset + 2] = value >>> 16;
      this[offset + 3] = value >>> 24;
    } else {
      objectWriteUInt32(this, value, offset, true);
    }

    return offset + 4;
  };

  Buffer$1.prototype.writeInt32BE = function writeInt32BE(value, offset, noAssert) {
    value = +value;
    offset = offset | 0;
    if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000);
    if (value < 0) value = 0xffffffff + value + 1;

    if (Buffer$1.TYPED_ARRAY_SUPPORT) {
      this[offset] = value >>> 24;
      this[offset + 1] = value >>> 16;
      this[offset + 2] = value >>> 8;
      this[offset + 3] = value & 0xff;
    } else {
      objectWriteUInt32(this, value, offset, false);
    }

    return offset + 4;
  };

  function checkIEEE754(buf, value, offset, ext, max, min) {
    if (offset + ext > buf.length) throw new RangeError('Index out of range');
    if (offset < 0) throw new RangeError('Index out of range');
  }

  function writeFloat(buf, value, offset, littleEndian, noAssert) {
    if (!noAssert) {
      checkIEEE754(buf, value, offset, 4);
    }

    write(buf, value, offset, littleEndian, 23, 4);
    return offset + 4;
  }

  Buffer$1.prototype.writeFloatLE = function writeFloatLE(value, offset, noAssert) {
    return writeFloat(this, value, offset, true, noAssert);
  };

  Buffer$1.prototype.writeFloatBE = function writeFloatBE(value, offset, noAssert) {
    return writeFloat(this, value, offset, false, noAssert);
  };

  function writeDouble(buf, value, offset, littleEndian, noAssert) {
    if (!noAssert) {
      checkIEEE754(buf, value, offset, 8);
    }

    write(buf, value, offset, littleEndian, 52, 8);
    return offset + 8;
  }

  Buffer$1.prototype.writeDoubleLE = function writeDoubleLE(value, offset, noAssert) {
    return writeDouble(this, value, offset, true, noAssert);
  };

  Buffer$1.prototype.writeDoubleBE = function writeDoubleBE(value, offset, noAssert) {
    return writeDouble(this, value, offset, false, noAssert);
  }; // copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)


  Buffer$1.prototype.copy = function copy(target, targetStart, start, end) {
    if (!start) start = 0;
    if (!end && end !== 0) end = this.length;
    if (targetStart >= target.length) targetStart = target.length;
    if (!targetStart) targetStart = 0;
    if (end > 0 && end < start) end = start; // Copy 0 bytes; we're done

    if (end === start) return 0;
    if (target.length === 0 || this.length === 0) return 0; // Fatal error conditions

    if (targetStart < 0) {
      throw new RangeError('targetStart out of bounds');
    }

    if (start < 0 || start >= this.length) throw new RangeError('sourceStart out of bounds');
    if (end < 0) throw new RangeError('sourceEnd out of bounds'); // Are we oob?

    if (end > this.length) end = this.length;

    if (target.length - targetStart < end - start) {
      end = target.length - targetStart + start;
    }

    var len = end - start;
    var i;

    if (this === target && start < targetStart && targetStart < end) {
      // descending copy from end
      for (i = len - 1; i >= 0; --i) {
        target[i + targetStart] = this[i + start];
      }
    } else if (len < 1000 || !Buffer$1.TYPED_ARRAY_SUPPORT) {
      // ascending copy from start
      for (i = 0; i < len; ++i) {
        target[i + targetStart] = this[i + start];
      }
    } else {
      Uint8Array.prototype.set.call(target, this.subarray(start, start + len), targetStart);
    }

    return len;
  }; // Usage:
  //    buffer.fill(number[, offset[, end]])
  //    buffer.fill(buffer[, offset[, end]])
  //    buffer.fill(string[, offset[, end]][, encoding])


  Buffer$1.prototype.fill = function fill(val, start, end, encoding) {
    // Handle string cases:
    if (typeof val === 'string') {
      if (typeof start === 'string') {
        encoding = start;
        start = 0;
        end = this.length;
      } else if (typeof end === 'string') {
        encoding = end;
        end = this.length;
      }

      if (val.length === 1) {
        var code = val.charCodeAt(0);

        if (code < 256) {
          val = code;
        }
      }

      if (encoding !== undefined && typeof encoding !== 'string') {
        throw new TypeError('encoding must be a string');
      }

      if (typeof encoding === 'string' && !Buffer$1.isEncoding(encoding)) {
        throw new TypeError('Unknown encoding: ' + encoding);
      }
    } else if (typeof val === 'number') {
      val = val & 255;
    } // Invalid ranges are not set to a default, so can range check early.


    if (start < 0 || this.length < start || this.length < end) {
      throw new RangeError('Out of range index');
    }

    if (end <= start) {
      return this;
    }

    start = start >>> 0;
    end = end === undefined ? this.length : end >>> 0;
    if (!val) val = 0;
    var i;

    if (typeof val === 'number') {
      for (i = start; i < end; ++i) {
        this[i] = val;
      }
    } else {
      var bytes = internalIsBuffer(val) ? val : utf8ToBytes(new Buffer$1(val, encoding).toString());
      var len = bytes.length;

      for (i = 0; i < end - start; ++i) {
        this[i + start] = bytes[i % len];
      }
    }

    return this;
  }; // HELPER FUNCTIONS
  // ================


  var INVALID_BASE64_RE = /[^+\/0-9A-Za-z-_]/g;

  function base64clean(str) {
    // Node strips out invalid characters like \n and \t from the string, base64-js does not
    str = stringtrim(str).replace(INVALID_BASE64_RE, ''); // Node converts strings with length < 2 to ''

    if (str.length < 2) return ''; // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not

    while (str.length % 4 !== 0) {
      str = str + '=';
    }

    return str;
  }

  function stringtrim(str) {
    if (str.trim) return str.trim();
    return str.replace(/^\s+|\s+$/g, '');
  }

  function toHex(n) {
    if (n < 16) return '0' + n.toString(16);
    return n.toString(16);
  }

  function utf8ToBytes(string, units) {
    units = units || Infinity;
    var codePoint;
    var length = string.length;
    var leadSurrogate = null;
    var bytes = [];

    for (var i = 0; i < length; ++i) {
      codePoint = string.charCodeAt(i); // is surrogate component

      if (codePoint > 0xD7FF && codePoint < 0xE000) {
        // last char was a lead
        if (!leadSurrogate) {
          // no lead yet
          if (codePoint > 0xDBFF) {
            // unexpected trail
            if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
            continue;
          } else if (i + 1 === length) {
            // unpaired lead
            if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
            continue;
          } // valid lead


          leadSurrogate = codePoint;
          continue;
        } // 2 leads in a row


        if (codePoint < 0xDC00) {
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
          leadSurrogate = codePoint;
          continue;
        } // valid surrogate pair


        codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000;
      } else if (leadSurrogate) {
        // valid bmp char, but last char was a lead
        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
      }

      leadSurrogate = null; // encode utf8

      if (codePoint < 0x80) {
        if ((units -= 1) < 0) break;
        bytes.push(codePoint);
      } else if (codePoint < 0x800) {
        if ((units -= 2) < 0) break;
        bytes.push(codePoint >> 0x6 | 0xC0, codePoint & 0x3F | 0x80);
      } else if (codePoint < 0x10000) {
        if ((units -= 3) < 0) break;
        bytes.push(codePoint >> 0xC | 0xE0, codePoint >> 0x6 & 0x3F | 0x80, codePoint & 0x3F | 0x80);
      } else if (codePoint < 0x110000) {
        if ((units -= 4) < 0) break;
        bytes.push(codePoint >> 0x12 | 0xF0, codePoint >> 0xC & 0x3F | 0x80, codePoint >> 0x6 & 0x3F | 0x80, codePoint & 0x3F | 0x80);
      } else {
        throw new Error('Invalid code point');
      }
    }

    return bytes;
  }

  function asciiToBytes(str) {
    var byteArray = [];

    for (var i = 0; i < str.length; ++i) {
      // Node's code seems to be doing this and not & 0x7F..
      byteArray.push(str.charCodeAt(i) & 0xFF);
    }

    return byteArray;
  }

  function utf16leToBytes(str, units) {
    var c, hi, lo;
    var byteArray = [];

    for (var i = 0; i < str.length; ++i) {
      if ((units -= 2) < 0) break;
      c = str.charCodeAt(i);
      hi = c >> 8;
      lo = c % 256;
      byteArray.push(lo);
      byteArray.push(hi);
    }

    return byteArray;
  }

  function base64ToBytes(str) {
    return toByteArray(base64clean(str));
  }

  function blitBuffer(src, dst, offset, length) {
    for (var i = 0; i < length; ++i) {
      if (i + offset >= dst.length || i >= src.length) break;
      dst[i + offset] = src[i];
    }

    return i;
  }

  function isnan(val) {
    return val !== val; // eslint-disable-line no-self-compare
  } // the following is from is-buffer, also by Feross Aboukhadijeh and with same lisence
  // The _isBuffer check is for Safari 5-7 support, because it's missing
  // Object.prototype.constructor. Remove this eventually


  function isBuffer$1(obj) {
    return obj != null && (!!obj._isBuffer || isFastBuffer(obj) || isSlowBuffer(obj));
  }

  function isFastBuffer(obj) {
    return !!obj.constructor && typeof obj.constructor.isBuffer === 'function' && obj.constructor.isBuffer(obj);
  } // For Node v0.10 support. Remove this eventually.


  function isSlowBuffer(obj) {
    return typeof obj.readFloatLE === 'function' && typeof obj.slice === 'function' && isFastBuffer(obj.slice(0, 0));
  }

  function BufferList() {
    this.head = null;
    this.tail = null;
    this.length = 0;
  }

  BufferList.prototype.push = function (v) {
    var entry = {
      data: v,
      next: null
    };
    if (this.length > 0) this.tail.next = entry;else this.head = entry;
    this.tail = entry;
    ++this.length;
  };

  BufferList.prototype.unshift = function (v) {
    var entry = {
      data: v,
      next: this.head
    };
    if (this.length === 0) this.tail = entry;
    this.head = entry;
    ++this.length;
  };

  BufferList.prototype.shift = function () {
    if (this.length === 0) return;
    var ret = this.head.data;
    if (this.length === 1) this.head = this.tail = null;else this.head = this.head.next;
    --this.length;
    return ret;
  };

  BufferList.prototype.clear = function () {
    this.head = this.tail = null;
    this.length = 0;
  };

  BufferList.prototype.join = function (s) {
    if (this.length === 0) return '';
    var p = this.head;
    var ret = '' + p.data;

    while (p = p.next) {
      ret += s + p.data;
    }

    return ret;
  };

  BufferList.prototype.concat = function (n) {
    if (this.length === 0) return Buffer$1.alloc(0);
    if (this.length === 1) return this.head.data;
    var ret = Buffer$1.allocUnsafe(n >>> 0);
    var p = this.head;
    var i = 0;

    while (p) {
      p.data.copy(ret, i);
      i += p.data.length;
      p = p.next;
    }

    return ret;
  };

  // Copyright Joyent, Inc. and other Node contributors.

  var isBufferEncoding = Buffer$1.isEncoding || function (encoding) {
    switch (encoding && encoding.toLowerCase()) {
      case 'hex':
      case 'utf8':
      case 'utf-8':
      case 'ascii':
      case 'binary':
      case 'base64':
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
      case 'raw':
        return true;

      default:
        return false;
    }
  };

  function assertEncoding(encoding) {
    if (encoding && !isBufferEncoding(encoding)) {
      throw new Error('Unknown encoding: ' + encoding);
    }
  } // StringDecoder provides an interface for efficiently splitting a series of
  // buffers into a series of JS strings without breaking apart multi-byte
  // characters. CESU-8 is handled as part of the UTF-8 encoding.
  //
  // @TODO Handling all encodings inside a single object makes it very difficult
  // to reason about this code, so it should be split up in the future.
  // @TODO There should be a utf8-strict encoding that rejects invalid UTF-8 code
  // points as used by CESU-8.


  function StringDecoder(encoding) {
    this.encoding = (encoding || 'utf8').toLowerCase().replace(/[-_]/, '');
    assertEncoding(encoding);

    switch (this.encoding) {
      case 'utf8':
        // CESU-8 represents each of Surrogate Pair by 3-bytes
        this.surrogateSize = 3;
        break;

      case 'ucs2':
      case 'utf16le':
        // UTF-16 represents each of Surrogate Pair by 2-bytes
        this.surrogateSize = 2;
        this.detectIncompleteChar = utf16DetectIncompleteChar;
        break;

      case 'base64':
        // Base-64 stores 3 bytes in 4 chars, and pads the remainder.
        this.surrogateSize = 3;
        this.detectIncompleteChar = base64DetectIncompleteChar;
        break;

      default:
        this.write = passThroughWrite;
        return;
    } // Enough space to store all bytes of a single character. UTF-8 needs 4
    // bytes, but CESU-8 may require up to 6 (3 bytes per surrogate).


    this.charBuffer = new Buffer$1(6); // Number of bytes received for the current incomplete multi-byte character.

    this.charReceived = 0; // Number of bytes expected for the current incomplete multi-byte character.

    this.charLength = 0;
  }
  // guaranteed to not contain any partial multi-byte characters. Any partial
  // character found at the end of the buffer is buffered up, and will be
  // returned when calling write again with the remaining bytes.
  //
  // Note: Converting a Buffer containing an orphan surrogate to a String
  // currently works, but converting a String to a Buffer (via `new Buffer`, or
  // Buffer#write) will replace incomplete surrogates with the unicode
  // replacement character. See https://codereview.chromium.org/121173009/ .

  StringDecoder.prototype.write = function (buffer) {
    var charStr = ''; // if our last write ended with an incomplete multibyte character

    while (this.charLength) {
      // determine how many remaining bytes this buffer has to offer for this char
      var available = buffer.length >= this.charLength - this.charReceived ? this.charLength - this.charReceived : buffer.length; // add the new bytes to the char buffer

      buffer.copy(this.charBuffer, this.charReceived, 0, available);
      this.charReceived += available;

      if (this.charReceived < this.charLength) {
        // still not enough chars in this buffer? wait for more ...
        return '';
      } // remove bytes belonging to the current character from the buffer


      buffer = buffer.slice(available, buffer.length); // get the character that was split

      charStr = this.charBuffer.slice(0, this.charLength).toString(this.encoding); // CESU-8: lead surrogate (D800-DBFF) is also the incomplete character

      var charCode = charStr.charCodeAt(charStr.length - 1);

      if (charCode >= 0xD800 && charCode <= 0xDBFF) {
        this.charLength += this.surrogateSize;
        charStr = '';
        continue;
      }

      this.charReceived = this.charLength = 0; // if there are no more bytes in this buffer, just emit our char

      if (buffer.length === 0) {
        return charStr;
      }

      break;
    } // determine and set charLength / charReceived


    this.detectIncompleteChar(buffer);
    var end = buffer.length;

    if (this.charLength) {
      // buffer the incomplete character bytes we got
      buffer.copy(this.charBuffer, 0, buffer.length - this.charReceived, end);
      end -= this.charReceived;
    }

    charStr += buffer.toString(this.encoding, 0, end);
    var end = charStr.length - 1;
    var charCode = charStr.charCodeAt(end); // CESU-8: lead surrogate (D800-DBFF) is also the incomplete character

    if (charCode >= 0xD800 && charCode <= 0xDBFF) {
      var size = this.surrogateSize;
      this.charLength += size;
      this.charReceived += size;
      this.charBuffer.copy(this.charBuffer, size, 0, size);
      buffer.copy(this.charBuffer, 0, 0, size);
      return charStr.substring(0, end);
    } // or just emit the charStr


    return charStr;
  }; // detectIncompleteChar determines if there is an incomplete UTF-8 character at
  // the end of the given buffer. If so, it sets this.charLength to the byte
  // length that character, and sets this.charReceived to the number of bytes
  // that are available for this character.


  StringDecoder.prototype.detectIncompleteChar = function (buffer) {
    // determine how many bytes we have to check at the end of this buffer
    var i = buffer.length >= 3 ? 3 : buffer.length; // Figure out if one of the last i bytes of our buffer announces an
    // incomplete char.

    for (; i > 0; i--) {
      var c = buffer[buffer.length - i]; // See http://en.wikipedia.org/wiki/UTF-8#Description
      // 110XXXXX

      if (i == 1 && c >> 5 == 0x06) {
        this.charLength = 2;
        break;
      } // 1110XXXX


      if (i <= 2 && c >> 4 == 0x0E) {
        this.charLength = 3;
        break;
      } // 11110XXX


      if (i <= 3 && c >> 3 == 0x1E) {
        this.charLength = 4;
        break;
      }
    }

    this.charReceived = i;
  };

  StringDecoder.prototype.end = function (buffer) {
    var res = '';
    if (buffer && buffer.length) res = this.write(buffer);

    if (this.charReceived) {
      var cr = this.charReceived;
      var buf = this.charBuffer;
      var enc = this.encoding;
      res += buf.slice(0, cr).toString(enc);
    }

    return res;
  };

  function passThroughWrite(buffer) {
    return buffer.toString(this.encoding);
  }

  function utf16DetectIncompleteChar(buffer) {
    this.charReceived = buffer.length % 2;
    this.charLength = this.charReceived ? 2 : 0;
  }

  function base64DetectIncompleteChar(buffer) {
    this.charReceived = buffer.length % 3;
    this.charLength = this.charReceived ? 3 : 0;
  }

  Readable.ReadableState = ReadableState;
  var debug = debuglog('stream');
  inherits$1(Readable, EventEmitter);

  function prependListener(emitter, event, fn) {
    // Sadly this is not cacheable as some libraries bundle their own
    // event emitter implementation with them.
    if (typeof emitter.prependListener === 'function') {
      return emitter.prependListener(event, fn);
    } else {
      // This is a hack to make sure that our error handler is attached before any
      // userland ones.  NEVER DO THIS. This is here only because this code needs
      // to continue to work with older versions of Node.js that do not include
      // the prependListener() method. The goal is to eventually remove this hack.
      if (!emitter._events || !emitter._events[event]) emitter.on(event, fn);else if (Array.isArray(emitter._events[event])) emitter._events[event].unshift(fn);else emitter._events[event] = [fn, emitter._events[event]];
    }
  }

  function listenerCount$1(emitter, type) {
    return emitter.listeners(type).length;
  }

  function ReadableState(options, stream) {
    options = options || {}; // object stream flag. Used to make read(n) ignore n and to
    // make all the buffer merging and length checks go away

    this.objectMode = !!options.objectMode;
    if (stream instanceof Duplex) this.objectMode = this.objectMode || !!options.readableObjectMode; // the point at which it stops calling _read() to fill the buffer
    // Note: 0 is a valid value, means "don't call _read preemptively ever"

    var hwm = options.highWaterMark;
    var defaultHwm = this.objectMode ? 16 : 16 * 1024;
    this.highWaterMark = hwm || hwm === 0 ? hwm : defaultHwm; // cast to ints.

    this.highWaterMark = ~~this.highWaterMark; // A linked list is used to store data chunks instead of an array because the
    // linked list can remove elements from the beginning faster than
    // array.shift()

    this.buffer = new BufferList();
    this.length = 0;
    this.pipes = null;
    this.pipesCount = 0;
    this.flowing = null;
    this.ended = false;
    this.endEmitted = false;
    this.reading = false; // a flag to be able to tell if the onwrite cb is called immediately,
    // or on a later tick.  We set this to true at first, because any
    // actions that shouldn't happen until "later" should generally also
    // not happen before the first write call.

    this.sync = true; // whenever we return null, then we set a flag to say
    // that we're awaiting a 'readable' event emission.

    this.needReadable = false;
    this.emittedReadable = false;
    this.readableListening = false;
    this.resumeScheduled = false; // Crypto is kind of old and crusty.  Historically, its default string
    // encoding is 'binary' so we have to make this configurable.
    // Everything else in the universe uses 'utf8', though.

    this.defaultEncoding = options.defaultEncoding || 'utf8'; // when piping, we only care about 'readable' events that happen
    // after read()ing all the bytes and not getting any pushback.

    this.ranOut = false; // the number of writers that are awaiting a drain event in .pipe()s

    this.awaitDrain = 0; // if true, a maybeReadMore has been scheduled

    this.readingMore = false;
    this.decoder = null;
    this.encoding = null;

    if (options.encoding) {
      this.decoder = new StringDecoder(options.encoding);
      this.encoding = options.encoding;
    }
  }
  function Readable(options) {
    if (!(this instanceof Readable)) return new Readable(options);
    this._readableState = new ReadableState(options, this); // legacy

    this.readable = true;
    if (options && typeof options.read === 'function') this._read = options.read;
    EventEmitter.call(this);
  } // Manually shove something into the read() buffer.
  // This returns true if the highWaterMark has not been hit yet,
  // similar to how Writable.write() returns true if you should
  // write() some more.

  Readable.prototype.push = function (chunk, encoding) {
    var state = this._readableState;

    if (!state.objectMode && typeof chunk === 'string') {
      encoding = encoding || state.defaultEncoding;

      if (encoding !== state.encoding) {
        chunk = Buffer.from(chunk, encoding);
        encoding = '';
      }
    }

    return readableAddChunk(this, state, chunk, encoding, false);
  }; // Unshift should *always* be something directly out of read()


  Readable.prototype.unshift = function (chunk) {
    var state = this._readableState;
    return readableAddChunk(this, state, chunk, '', true);
  };

  Readable.prototype.isPaused = function () {
    return this._readableState.flowing === false;
  };

  function readableAddChunk(stream, state, chunk, encoding, addToFront) {
    var er = chunkInvalid(state, chunk);

    if (er) {
      stream.emit('error', er);
    } else if (chunk === null) {
      state.reading = false;
      onEofChunk(stream, state);
    } else if (state.objectMode || chunk && chunk.length > 0) {
      if (state.ended && !addToFront) {
        var e = new Error('stream.push() after EOF');
        stream.emit('error', e);
      } else if (state.endEmitted && addToFront) {
        var _e = new Error('stream.unshift() after end event');

        stream.emit('error', _e);
      } else {
        var skipAdd;

        if (state.decoder && !addToFront && !encoding) {
          chunk = state.decoder.write(chunk);
          skipAdd = !state.objectMode && chunk.length === 0;
        }

        if (!addToFront) state.reading = false; // Don't add to the buffer if we've decoded to an empty string chunk and
        // we're not in object mode

        if (!skipAdd) {
          // if we want the data now, just emit it.
          if (state.flowing && state.length === 0 && !state.sync) {
            stream.emit('data', chunk);
            stream.read(0);
          } else {
            // update the buffer info.
            state.length += state.objectMode ? 1 : chunk.length;
            if (addToFront) state.buffer.unshift(chunk);else state.buffer.push(chunk);
            if (state.needReadable) emitReadable(stream);
          }
        }

        maybeReadMore(stream, state);
      }
    } else if (!addToFront) {
      state.reading = false;
    }

    return needMoreData(state);
  } // if it's past the high water mark, we can push in some more.
  // Also, if we have no data yet, we can stand some
  // more bytes.  This is to work around cases where hwm=0,
  // such as the repl.  Also, if the push() triggered a
  // readable event, and the user called read(largeNumber) such that
  // needReadable was set, then we ought to push more, so that another
  // 'readable' event will be triggered.


  function needMoreData(state) {
    return !state.ended && (state.needReadable || state.length < state.highWaterMark || state.length === 0);
  } // backwards compatibility.


  Readable.prototype.setEncoding = function (enc) {
    this._readableState.decoder = new StringDecoder(enc);
    this._readableState.encoding = enc;
    return this;
  }; // Don't raise the hwm > 8MB


  var MAX_HWM = 0x800000;

  function computeNewHighWaterMark(n) {
    if (n >= MAX_HWM) {
      n = MAX_HWM;
    } else {
      // Get the next highest power of 2 to prevent increasing hwm excessively in
      // tiny amounts
      n--;
      n |= n >>> 1;
      n |= n >>> 2;
      n |= n >>> 4;
      n |= n >>> 8;
      n |= n >>> 16;
      n++;
    }

    return n;
  } // This function is designed to be inlinable, so please take care when making
  // changes to the function body.


  function howMuchToRead(n, state) {
    if (n <= 0 || state.length === 0 && state.ended) return 0;
    if (state.objectMode) return 1;

    if (n !== n) {
      // Only flow one buffer at a time
      if (state.flowing && state.length) return state.buffer.head.data.length;else return state.length;
    } // If we're asking for more than the current hwm, then raise the hwm.


    if (n > state.highWaterMark) state.highWaterMark = computeNewHighWaterMark(n);
    if (n <= state.length) return n; // Don't have enough

    if (!state.ended) {
      state.needReadable = true;
      return 0;
    }

    return state.length;
  } // you can override either this method, or the async _read(n) below.


  Readable.prototype.read = function (n) {
    debug('read', n);
    n = parseInt(n, 10);
    var state = this._readableState;
    var nOrig = n;
    if (n !== 0) state.emittedReadable = false; // if we're doing read(0) to trigger a readable event, but we
    // already have a bunch of data in the buffer, then just trigger
    // the 'readable' event and move on.

    if (n === 0 && state.needReadable && (state.length >= state.highWaterMark || state.ended)) {
      debug('read: emitReadable', state.length, state.ended);
      if (state.length === 0 && state.ended) endReadable(this);else emitReadable(this);
      return null;
    }

    n = howMuchToRead(n, state); // if we've ended, and we're now clear, then finish it up.

    if (n === 0 && state.ended) {
      if (state.length === 0) endReadable(this);
      return null;
    } // All the actual chunk generation logic needs to be
    // *below* the call to _read.  The reason is that in certain
    // synthetic stream cases, such as passthrough streams, _read
    // may be a completely synchronous operation which may change
    // the state of the read buffer, providing enough data when
    // before there was *not* enough.
    //
    // So, the steps are:
    // 1. Figure out what the state of things will be after we do
    // a read from the buffer.
    //
    // 2. If that resulting state will trigger a _read, then call _read.
    // Note that this may be asynchronous, or synchronous.  Yes, it is
    // deeply ugly to write APIs this way, but that still doesn't mean
    // that the Readable class should behave improperly, as streams are
    // designed to be sync/async agnostic.
    // Take note if the _read call is sync or async (ie, if the read call
    // has returned yet), so that we know whether or not it's safe to emit
    // 'readable' etc.
    //
    // 3. Actually pull the requested chunks out of the buffer and return.
    // if we need a readable event, then we need to do some reading.


    var doRead = state.needReadable;
    debug('need readable', doRead); // if we currently have less than the highWaterMark, then also read some

    if (state.length === 0 || state.length - n < state.highWaterMark) {
      doRead = true;
      debug('length less than watermark', doRead);
    } // however, if we've ended, then there's no point, and if we're already
    // reading, then it's unnecessary.


    if (state.ended || state.reading) {
      doRead = false;
      debug('reading or ended', doRead);
    } else if (doRead) {
      debug('do read');
      state.reading = true;
      state.sync = true; // if the length is currently zero, then we *need* a readable event.

      if (state.length === 0) state.needReadable = true; // call internal read method

      this._read(state.highWaterMark);

      state.sync = false; // If _read pushed data synchronously, then `reading` will be false,
      // and we need to re-evaluate how much data we can return to the user.

      if (!state.reading) n = howMuchToRead(nOrig, state);
    }

    var ret;
    if (n > 0) ret = fromList(n, state);else ret = null;

    if (ret === null) {
      state.needReadable = true;
      n = 0;
    } else {
      state.length -= n;
    }

    if (state.length === 0) {
      // If we have nothing in the buffer, then we want to know
      // as soon as we *do* get something into the buffer.
      if (!state.ended) state.needReadable = true; // If we tried to read() past the EOF, then emit end on the next tick.

      if (nOrig !== n && state.ended) endReadable(this);
    }

    if (ret !== null) this.emit('data', ret);
    return ret;
  };

  function chunkInvalid(state, chunk) {
    var er = null;

    if (!Buffer.isBuffer(chunk) && typeof chunk !== 'string' && chunk !== null && chunk !== undefined && !state.objectMode) {
      er = new TypeError('Invalid non-string/buffer chunk');
    }

    return er;
  }

  function onEofChunk(stream, state) {
    if (state.ended) return;

    if (state.decoder) {
      var chunk = state.decoder.end();

      if (chunk && chunk.length) {
        state.buffer.push(chunk);
        state.length += state.objectMode ? 1 : chunk.length;
      }
    }

    state.ended = true; // emit 'readable' now to make sure it gets picked up.

    emitReadable(stream);
  } // Don't emit readable right away in sync mode, because this can trigger
  // another read() call => stack overflow.  This way, it might trigger
  // a nextTick recursion warning, but that's not so bad.


  function emitReadable(stream) {
    var state = stream._readableState;
    state.needReadable = false;

    if (!state.emittedReadable) {
      debug('emitReadable', state.flowing);
      state.emittedReadable = true;
      if (state.sync) nextTick(emitReadable_, stream);else emitReadable_(stream);
    }
  }

  function emitReadable_(stream) {
    debug('emit readable');
    stream.emit('readable');
    flow(stream);
  } // at this point, the user has presumably seen the 'readable' event,
  // and called read() to consume some data.  that may have triggered
  // in turn another _read(n) call, in which case reading = true if
  // it's in progress.
  // However, if we're not ended, or reading, and the length < hwm,
  // then go ahead and try to read some more preemptively.


  function maybeReadMore(stream, state) {
    if (!state.readingMore) {
      state.readingMore = true;
      nextTick(maybeReadMore_, stream, state);
    }
  }

  function maybeReadMore_(stream, state) {
    var len = state.length;

    while (!state.reading && !state.flowing && !state.ended && state.length < state.highWaterMark) {
      debug('maybeReadMore read 0');
      stream.read(0);
      if (len === state.length) // didn't get any data, stop spinning.
        break;else len = state.length;
    }

    state.readingMore = false;
  } // abstract method.  to be overridden in specific implementation classes.
  // call cb(er, data) where data is <= n in length.
  // for virtual (non-string, non-buffer) streams, "length" is somewhat
  // arbitrary, and perhaps not very meaningful.


  Readable.prototype._read = function (n) {
    this.emit('error', new Error('not implemented'));
  };

  Readable.prototype.pipe = function (dest, pipeOpts) {
    var src = this;
    var state = this._readableState;

    switch (state.pipesCount) {
      case 0:
        state.pipes = dest;
        break;

      case 1:
        state.pipes = [state.pipes, dest];
        break;

      default:
        state.pipes.push(dest);
        break;
    }

    state.pipesCount += 1;
    debug('pipe count=%d opts=%j', state.pipesCount, pipeOpts);
    var doEnd = !pipeOpts || pipeOpts.end !== false;
    var endFn = doEnd ? onend : cleanup;
    if (state.endEmitted) nextTick(endFn);else src.once('end', endFn);
    dest.on('unpipe', onunpipe);

    function onunpipe(readable) {
      debug('onunpipe');

      if (readable === src) {
        cleanup();
      }
    }

    function onend() {
      debug('onend');
      dest.end();
    } // when the dest drains, it reduces the awaitDrain counter
    // on the source.  This would be more elegant with a .once()
    // handler in flow(), but adding and removing repeatedly is
    // too slow.


    var ondrain = pipeOnDrain(src);
    dest.on('drain', ondrain);
    var cleanedUp = false;

    function cleanup() {
      debug('cleanup'); // cleanup event handlers once the pipe is broken

      dest.removeListener('close', onclose);
      dest.removeListener('finish', onfinish);
      dest.removeListener('drain', ondrain);
      dest.removeListener('error', onerror);
      dest.removeListener('unpipe', onunpipe);
      src.removeListener('end', onend);
      src.removeListener('end', cleanup);
      src.removeListener('data', ondata);
      cleanedUp = true; // if the reader is waiting for a drain event from this
      // specific writer, then it would cause it to never start
      // flowing again.
      // So, if this is awaiting a drain, then we just call it now.
      // If we don't know, then assume that we are waiting for one.

      if (state.awaitDrain && (!dest._writableState || dest._writableState.needDrain)) ondrain();
    } // If the user pushes more data while we're writing to dest then we'll end up
    // in ondata again. However, we only want to increase awaitDrain once because
    // dest will only emit one 'drain' event for the multiple writes.
    // => Introduce a guard on increasing awaitDrain.


    var increasedAwaitDrain = false;
    src.on('data', ondata);

    function ondata(chunk) {
      debug('ondata');
      increasedAwaitDrain = false;
      var ret = dest.write(chunk);

      if (false === ret && !increasedAwaitDrain) {
        // If the user unpiped during `dest.write()`, it is possible
        // to get stuck in a permanently paused state if that write
        // also returned false.
        // => Check whether `dest` is still a piping destination.
        if ((state.pipesCount === 1 && state.pipes === dest || state.pipesCount > 1 && indexOf(state.pipes, dest) !== -1) && !cleanedUp) {
          debug('false write response, pause', src._readableState.awaitDrain);
          src._readableState.awaitDrain++;
          increasedAwaitDrain = true;
        }

        src.pause();
      }
    } // if the dest has an error, then stop piping into it.
    // however, don't suppress the throwing behavior for this.


    function onerror(er) {
      debug('onerror', er);
      unpipe();
      dest.removeListener('error', onerror);
      if (listenerCount$1(dest, 'error') === 0) dest.emit('error', er);
    } // Make sure our error handler is attached before userland ones.


    prependListener(dest, 'error', onerror); // Both close and finish should trigger unpipe, but only once.

    function onclose() {
      dest.removeListener('finish', onfinish);
      unpipe();
    }

    dest.once('close', onclose);

    function onfinish() {
      debug('onfinish');
      dest.removeListener('close', onclose);
      unpipe();
    }

    dest.once('finish', onfinish);

    function unpipe() {
      debug('unpipe');
      src.unpipe(dest);
    } // tell the dest that it's being piped to


    dest.emit('pipe', src); // start the flow if it hasn't been started already.

    if (!state.flowing) {
      debug('pipe resume');
      src.resume();
    }

    return dest;
  };

  function pipeOnDrain(src) {
    return function () {
      var state = src._readableState;
      debug('pipeOnDrain', state.awaitDrain);
      if (state.awaitDrain) state.awaitDrain--;

      if (state.awaitDrain === 0 && src.listeners('data').length) {
        state.flowing = true;
        flow(src);
      }
    };
  }

  Readable.prototype.unpipe = function (dest) {
    var state = this._readableState; // if we're not piping anywhere, then do nothing.

    if (state.pipesCount === 0) return this; // just one destination.  most common case.

    if (state.pipesCount === 1) {
      // passed in one, but it's not the right one.
      if (dest && dest !== state.pipes) return this;
      if (!dest) dest = state.pipes; // got a match.

      state.pipes = null;
      state.pipesCount = 0;
      state.flowing = false;
      if (dest) dest.emit('unpipe', this);
      return this;
    } // slow case. multiple pipe destinations.


    if (!dest) {
      // remove all.
      var dests = state.pipes;
      var len = state.pipesCount;
      state.pipes = null;
      state.pipesCount = 0;
      state.flowing = false;

      for (var _i = 0; _i < len; _i++) {
        dests[_i].emit('unpipe', this);
      }

      return this;
    } // try to find the right one.


    var i = indexOf(state.pipes, dest);
    if (i === -1) return this;
    state.pipes.splice(i, 1);
    state.pipesCount -= 1;
    if (state.pipesCount === 1) state.pipes = state.pipes[0];
    dest.emit('unpipe', this);
    return this;
  }; // set up data events if they are asked for
  // Ensure readable listeners eventually get something


  Readable.prototype.on = function (ev, fn) {
    var res = EventEmitter.prototype.on.call(this, ev, fn);

    if (ev === 'data') {
      // Start flowing on next tick if stream isn't explicitly paused
      if (this._readableState.flowing !== false) this.resume();
    } else if (ev === 'readable') {
      var state = this._readableState;

      if (!state.endEmitted && !state.readableListening) {
        state.readableListening = state.needReadable = true;
        state.emittedReadable = false;

        if (!state.reading) {
          nextTick(nReadingNextTick, this);
        } else if (state.length) {
          emitReadable(this);
        }
      }
    }

    return res;
  };

  Readable.prototype.addListener = Readable.prototype.on;

  function nReadingNextTick(self) {
    debug('readable nexttick read 0');
    self.read(0);
  } // pause() and resume() are remnants of the legacy readable stream API
  // If the user uses them, then switch into old mode.


  Readable.prototype.resume = function () {
    var state = this._readableState;

    if (!state.flowing) {
      debug('resume');
      state.flowing = true;
      resume(this, state);
    }

    return this;
  };

  function resume(stream, state) {
    if (!state.resumeScheduled) {
      state.resumeScheduled = true;
      nextTick(resume_, stream, state);
    }
  }

  function resume_(stream, state) {
    if (!state.reading) {
      debug('resume read 0');
      stream.read(0);
    }

    state.resumeScheduled = false;
    state.awaitDrain = 0;
    stream.emit('resume');
    flow(stream);
    if (state.flowing && !state.reading) stream.read(0);
  }

  Readable.prototype.pause = function () {
    debug('call pause flowing=%j', this._readableState.flowing);

    if (false !== this._readableState.flowing) {
      debug('pause');
      this._readableState.flowing = false;
      this.emit('pause');
    }

    return this;
  };

  function flow(stream) {
    var state = stream._readableState;
    debug('flow', state.flowing);

    while (state.flowing && stream.read() !== null) {}
  } // wrap an old-style stream as the async data source.
  // This is *not* part of the readable stream interface.
  // It is an ugly unfortunate mess of history.


  Readable.prototype.wrap = function (stream) {
    var state = this._readableState;
    var paused = false;
    var self = this;
    stream.on('end', function () {
      debug('wrapped end');

      if (state.decoder && !state.ended) {
        var chunk = state.decoder.end();
        if (chunk && chunk.length) self.push(chunk);
      }

      self.push(null);
    });
    stream.on('data', function (chunk) {
      debug('wrapped data');
      if (state.decoder) chunk = state.decoder.write(chunk); // don't skip over falsy values in objectMode

      if (state.objectMode && (chunk === null || chunk === undefined)) return;else if (!state.objectMode && (!chunk || !chunk.length)) return;
      var ret = self.push(chunk);

      if (!ret) {
        paused = true;
        stream.pause();
      }
    }); // proxy all the other methods.
    // important when wrapping filters and duplexes.

    for (var i in stream) {
      if (this[i] === undefined && typeof stream[i] === 'function') {
        this[i] = function (method) {
          return function () {
            return stream[method].apply(stream, arguments);
          };
        }(i);
      }
    } // proxy certain important events.


    var events = ['error', 'close', 'destroy', 'pause', 'resume'];
    forEach(events, function (ev) {
      stream.on(ev, self.emit.bind(self, ev));
    }); // when we try to consume some more bytes, simply unpause the
    // underlying stream.

    self._read = function (n) {
      debug('wrapped _read', n);

      if (paused) {
        paused = false;
        stream.resume();
      }
    };

    return self;
  }; // exposed for testing purposes only.


  Readable._fromList = fromList; // Pluck off n bytes from an array of buffers.
  // Length is the combined lengths of all the buffers in the list.
  // This function is designed to be inlinable, so please take care when making
  // changes to the function body.

  function fromList(n, state) {
    // nothing buffered
    if (state.length === 0) return null;
    var ret;
    if (state.objectMode) ret = state.buffer.shift();else if (!n || n >= state.length) {
      // read it all, truncate the list
      if (state.decoder) ret = state.buffer.join('');else if (state.buffer.length === 1) ret = state.buffer.head.data;else ret = state.buffer.concat(state.length);
      state.buffer.clear();
    } else {
      // read part of list
      ret = fromListPartial(n, state.buffer, state.decoder);
    }
    return ret;
  } // Extracts only enough buffered data to satisfy the amount requested.
  // This function is designed to be inlinable, so please take care when making
  // changes to the function body.


  function fromListPartial(n, list, hasStrings) {
    var ret;

    if (n < list.head.data.length) {
      // slice is the same for buffers and strings
      ret = list.head.data.slice(0, n);
      list.head.data = list.head.data.slice(n);
    } else if (n === list.head.data.length) {
      // first chunk is a perfect match
      ret = list.shift();
    } else {
      // result spans more than one buffer
      ret = hasStrings ? copyFromBufferString(n, list) : copyFromBuffer(n, list);
    }

    return ret;
  } // Copies a specified amount of characters from the list of buffered data
  // chunks.
  // This function is designed to be inlinable, so please take care when making
  // changes to the function body.


  function copyFromBufferString(n, list) {
    var p = list.head;
    var c = 1;
    var ret = p.data;
    n -= ret.length;

    while (p = p.next) {
      var str = p.data;
      var nb = n > str.length ? str.length : n;
      if (nb === str.length) ret += str;else ret += str.slice(0, n);
      n -= nb;

      if (n === 0) {
        if (nb === str.length) {
          ++c;
          if (p.next) list.head = p.next;else list.head = list.tail = null;
        } else {
          list.head = p;
          p.data = str.slice(nb);
        }

        break;
      }

      ++c;
    }

    list.length -= c;
    return ret;
  } // Copies a specified amount of bytes from the list of buffered data chunks.
  // This function is designed to be inlinable, so please take care when making
  // changes to the function body.


  function copyFromBuffer(n, list) {
    var ret = Buffer.allocUnsafe(n);
    var p = list.head;
    var c = 1;
    p.data.copy(ret);
    n -= p.data.length;

    while (p = p.next) {
      var buf = p.data;
      var nb = n > buf.length ? buf.length : n;
      buf.copy(ret, ret.length - n, 0, nb);
      n -= nb;

      if (n === 0) {
        if (nb === buf.length) {
          ++c;
          if (p.next) list.head = p.next;else list.head = list.tail = null;
        } else {
          list.head = p;
          p.data = buf.slice(nb);
        }

        break;
      }

      ++c;
    }

    list.length -= c;
    return ret;
  }

  function endReadable(stream) {
    var state = stream._readableState; // If we get here before consuming all the bytes, then that is a
    // bug in node.  Should never happen.

    if (state.length > 0) throw new Error('"endReadable()" called on non-empty stream');

    if (!state.endEmitted) {
      state.ended = true;
      nextTick(endReadableNT, state, stream);
    }
  }

  function endReadableNT(state, stream) {
    // Check that we didn't get one last unshift.
    if (!state.endEmitted && state.length === 0) {
      state.endEmitted = true;
      stream.readable = false;
      stream.emit('end');
    }
  }

  function forEach(xs, f) {
    for (var i = 0, l = xs.length; i < l; i++) {
      f(xs[i], i);
    }
  }

  function indexOf(xs, x) {
    for (var i = 0, l = xs.length; i < l; i++) {
      if (xs[i] === x) return i;
    }

    return -1;
  }

  // A bit simpler than readable streams.
  Writable.WritableState = WritableState;
  inherits$1(Writable, EventEmitter);

  function nop() {}

  function WriteReq(chunk, encoding, cb) {
    this.chunk = chunk;
    this.encoding = encoding;
    this.callback = cb;
    this.next = null;
  }

  function WritableState(options, stream) {
    Object.defineProperty(this, 'buffer', {
      get: deprecate(function () {
        return this.getBuffer();
      }, '_writableState.buffer is deprecated. Use _writableState.getBuffer ' + 'instead.')
    });
    options = options || {}; // object stream flag to indicate whether or not this stream
    // contains buffers or objects.

    this.objectMode = !!options.objectMode;
    if (stream instanceof Duplex) this.objectMode = this.objectMode || !!options.writableObjectMode; // the point at which write() starts returning false
    // Note: 0 is a valid value, means that we always return false if
    // the entire buffer is not flushed immediately on write()

    var hwm = options.highWaterMark;
    var defaultHwm = this.objectMode ? 16 : 16 * 1024;
    this.highWaterMark = hwm || hwm === 0 ? hwm : defaultHwm; // cast to ints.

    this.highWaterMark = ~~this.highWaterMark;
    this.needDrain = false; // at the start of calling end()

    this.ending = false; // when end() has been called, and returned

    this.ended = false; // when 'finish' is emitted

    this.finished = false; // should we decode strings into buffers before passing to _write?
    // this is here so that some node-core streams can optimize string
    // handling at a lower level.

    var noDecode = options.decodeStrings === false;
    this.decodeStrings = !noDecode; // Crypto is kind of old and crusty.  Historically, its default string
    // encoding is 'binary' so we have to make this configurable.
    // Everything else in the universe uses 'utf8', though.

    this.defaultEncoding = options.defaultEncoding || 'utf8'; // not an actual buffer we keep track of, but a measurement
    // of how much we're waiting to get pushed to some underlying
    // socket or file.

    this.length = 0; // a flag to see when we're in the middle of a write.

    this.writing = false; // when true all writes will be buffered until .uncork() call

    this.corked = 0; // a flag to be able to tell if the onwrite cb is called immediately,
    // or on a later tick.  We set this to true at first, because any
    // actions that shouldn't happen until "later" should generally also
    // not happen before the first write call.

    this.sync = true; // a flag to know if we're processing previously buffered items, which
    // may call the _write() callback in the same tick, so that we don't
    // end up in an overlapped onwrite situation.

    this.bufferProcessing = false; // the callback that's passed to _write(chunk,cb)

    this.onwrite = function (er) {
      onwrite(stream, er);
    }; // the callback that the user supplies to write(chunk,encoding,cb)


    this.writecb = null; // the amount that is being written when _write is called.

    this.writelen = 0;
    this.bufferedRequest = null;
    this.lastBufferedRequest = null; // number of pending user-supplied write callbacks
    // this must be 0 before 'finish' can be emitted

    this.pendingcb = 0; // emit prefinish if the only thing we're waiting for is _write cbs
    // This is relevant for synchronous Transform streams

    this.prefinished = false; // True if the error was already emitted and should not be thrown again

    this.errorEmitted = false; // count buffered requests

    this.bufferedRequestCount = 0; // allocate the first CorkedRequest, there is always
    // one allocated and free to use, and we maintain at most two

    this.corkedRequestsFree = new CorkedRequest(this);
  }

  WritableState.prototype.getBuffer = function writableStateGetBuffer() {
    var current = this.bufferedRequest;
    var out = [];

    while (current) {
      out.push(current);
      current = current.next;
    }

    return out;
  };
  function Writable(options) {
    // Writable ctor is applied to Duplexes, though they're not
    // instanceof Writable, they're instanceof Readable.
    if (!(this instanceof Writable) && !(this instanceof Duplex)) return new Writable(options);
    this._writableState = new WritableState(options, this); // legacy.

    this.writable = true;

    if (options) {
      if (typeof options.write === 'function') this._write = options.write;
      if (typeof options.writev === 'function') this._writev = options.writev;
    }

    EventEmitter.call(this);
  } // Otherwise people can pipe Writable streams, which is just wrong.

  Writable.prototype.pipe = function () {
    this.emit('error', new Error('Cannot pipe, not readable'));
  };

  function writeAfterEnd(stream, cb) {
    var er = new Error('write after end'); // TODO: defer error events consistently everywhere, not just the cb

    stream.emit('error', er);
    nextTick(cb, er);
  } // If we get something that is not a buffer, string, null, or undefined,
  // and we're not in objectMode, then that's an error.
  // Otherwise stream chunks are all considered to be of length=1, and the
  // watermarks determine how many objects to keep in the buffer, rather than
  // how many bytes or characters.


  function validChunk(stream, state, chunk, cb) {
    var valid = true;
    var er = false; // Always throw error if a null is written
    // if we are not in object mode then throw
    // if it is not a buffer, string, or undefined.

    if (chunk === null) {
      er = new TypeError('May not write null values to stream');
    } else if (!Buffer$1.isBuffer(chunk) && typeof chunk !== 'string' && chunk !== undefined && !state.objectMode) {
      er = new TypeError('Invalid non-string/buffer chunk');
    }

    if (er) {
      stream.emit('error', er);
      nextTick(cb, er);
      valid = false;
    }

    return valid;
  }

  Writable.prototype.write = function (chunk, encoding, cb) {
    var state = this._writableState;
    var ret = false;

    if (typeof encoding === 'function') {
      cb = encoding;
      encoding = null;
    }

    if (Buffer$1.isBuffer(chunk)) encoding = 'buffer';else if (!encoding) encoding = state.defaultEncoding;
    if (typeof cb !== 'function') cb = nop;
    if (state.ended) writeAfterEnd(this, cb);else if (validChunk(this, state, chunk, cb)) {
      state.pendingcb++;
      ret = writeOrBuffer(this, state, chunk, encoding, cb);
    }
    return ret;
  };

  Writable.prototype.cork = function () {
    var state = this._writableState;
    state.corked++;
  };

  Writable.prototype.uncork = function () {
    var state = this._writableState;

    if (state.corked) {
      state.corked--;
      if (!state.writing && !state.corked && !state.finished && !state.bufferProcessing && state.bufferedRequest) clearBuffer(this, state);
    }
  };

  Writable.prototype.setDefaultEncoding = function setDefaultEncoding(encoding) {
    // node::ParseEncoding() requires lower case.
    if (typeof encoding === 'string') encoding = encoding.toLowerCase();
    if (!(['hex', 'utf8', 'utf-8', 'ascii', 'binary', 'base64', 'ucs2', 'ucs-2', 'utf16le', 'utf-16le', 'raw'].indexOf((encoding + '').toLowerCase()) > -1)) throw new TypeError('Unknown encoding: ' + encoding);
    this._writableState.defaultEncoding = encoding;
    return this;
  };

  function decodeChunk(state, chunk, encoding) {
    if (!state.objectMode && state.decodeStrings !== false && typeof chunk === 'string') {
      chunk = Buffer$1.from(chunk, encoding);
    }

    return chunk;
  } // if we're already writing something, then just put this
  // in the queue, and wait our turn.  Otherwise, call _write
  // If we return false, then we need a drain event, so set that flag.


  function writeOrBuffer(stream, state, chunk, encoding, cb) {
    chunk = decodeChunk(state, chunk, encoding);
    if (Buffer$1.isBuffer(chunk)) encoding = 'buffer';
    var len = state.objectMode ? 1 : chunk.length;
    state.length += len;
    var ret = state.length < state.highWaterMark; // we must ensure that previous needDrain will not be reset to false.

    if (!ret) state.needDrain = true;

    if (state.writing || state.corked) {
      var last = state.lastBufferedRequest;
      state.lastBufferedRequest = new WriteReq(chunk, encoding, cb);

      if (last) {
        last.next = state.lastBufferedRequest;
      } else {
        state.bufferedRequest = state.lastBufferedRequest;
      }

      state.bufferedRequestCount += 1;
    } else {
      doWrite(stream, state, false, len, chunk, encoding, cb);
    }

    return ret;
  }

  function doWrite(stream, state, writev, len, chunk, encoding, cb) {
    state.writelen = len;
    state.writecb = cb;
    state.writing = true;
    state.sync = true;
    if (writev) stream._writev(chunk, state.onwrite);else stream._write(chunk, encoding, state.onwrite);
    state.sync = false;
  }

  function onwriteError(stream, state, sync, er, cb) {
    --state.pendingcb;
    if (sync) nextTick(cb, er);else cb(er);
    stream._writableState.errorEmitted = true;
    stream.emit('error', er);
  }

  function onwriteStateUpdate(state) {
    state.writing = false;
    state.writecb = null;
    state.length -= state.writelen;
    state.writelen = 0;
  }

  function onwrite(stream, er) {
    var state = stream._writableState;
    var sync = state.sync;
    var cb = state.writecb;
    onwriteStateUpdate(state);
    if (er) onwriteError(stream, state, sync, er, cb);else {
      // Check if we're actually ready to finish, but don't emit yet
      var finished = needFinish(state);

      if (!finished && !state.corked && !state.bufferProcessing && state.bufferedRequest) {
        clearBuffer(stream, state);
      }

      if (sync) {
        /*<replacement>*/
        nextTick(afterWrite, stream, state, finished, cb);
        /*</replacement>*/
      } else {
        afterWrite(stream, state, finished, cb);
      }
    }
  }

  function afterWrite(stream, state, finished, cb) {
    if (!finished) onwriteDrain(stream, state);
    state.pendingcb--;
    cb();
    finishMaybe(stream, state);
  } // Must force callback to be called on nextTick, so that we don't
  // emit 'drain' before the write() consumer gets the 'false' return
  // value, and has a chance to attach a 'drain' listener.


  function onwriteDrain(stream, state) {
    if (state.length === 0 && state.needDrain) {
      state.needDrain = false;
      stream.emit('drain');
    }
  } // if there's something in the buffer waiting, then process it


  function clearBuffer(stream, state) {
    state.bufferProcessing = true;
    var entry = state.bufferedRequest;

    if (stream._writev && entry && entry.next) {
      // Fast case, write everything using _writev()
      var l = state.bufferedRequestCount;
      var buffer = new Array(l);
      var holder = state.corkedRequestsFree;
      holder.entry = entry;
      var count = 0;

      while (entry) {
        buffer[count] = entry;
        entry = entry.next;
        count += 1;
      }

      doWrite(stream, state, true, state.length, buffer, '', holder.finish); // doWrite is almost always async, defer these to save a bit of time
      // as the hot path ends with doWrite

      state.pendingcb++;
      state.lastBufferedRequest = null;

      if (holder.next) {
        state.corkedRequestsFree = holder.next;
        holder.next = null;
      } else {
        state.corkedRequestsFree = new CorkedRequest(state);
      }
    } else {
      // Slow case, write chunks one-by-one
      while (entry) {
        var chunk = entry.chunk;
        var encoding = entry.encoding;
        var cb = entry.callback;
        var len = state.objectMode ? 1 : chunk.length;
        doWrite(stream, state, false, len, chunk, encoding, cb);
        entry = entry.next; // if we didn't call the onwrite immediately, then
        // it means that we need to wait until it does.
        // also, that means that the chunk and cb are currently
        // being processed, so move the buffer counter past them.

        if (state.writing) {
          break;
        }
      }

      if (entry === null) state.lastBufferedRequest = null;
    }

    state.bufferedRequestCount = 0;
    state.bufferedRequest = entry;
    state.bufferProcessing = false;
  }

  Writable.prototype._write = function (chunk, encoding, cb) {
    cb(new Error('not implemented'));
  };

  Writable.prototype._writev = null;

  Writable.prototype.end = function (chunk, encoding, cb) {
    var state = this._writableState;

    if (typeof chunk === 'function') {
      cb = chunk;
      chunk = null;
      encoding = null;
    } else if (typeof encoding === 'function') {
      cb = encoding;
      encoding = null;
    }

    if (chunk !== null && chunk !== undefined) this.write(chunk, encoding); // .end() fully uncorks

    if (state.corked) {
      state.corked = 1;
      this.uncork();
    } // ignore unnecessary end() calls.


    if (!state.ending && !state.finished) endWritable(this, state, cb);
  };

  function needFinish(state) {
    return state.ending && state.length === 0 && state.bufferedRequest === null && !state.finished && !state.writing;
  }

  function prefinish(stream, state) {
    if (!state.prefinished) {
      state.prefinished = true;
      stream.emit('prefinish');
    }
  }

  function finishMaybe(stream, state) {
    var need = needFinish(state);

    if (need) {
      if (state.pendingcb === 0) {
        prefinish(stream, state);
        state.finished = true;
        stream.emit('finish');
      } else {
        prefinish(stream, state);
      }
    }

    return need;
  }

  function endWritable(stream, state, cb) {
    state.ending = true;
    finishMaybe(stream, state);

    if (cb) {
      if (state.finished) nextTick(cb);else stream.once('finish', cb);
    }

    state.ended = true;
    stream.writable = false;
  } // It seems a linked list but it is not
  // there will be only 2 of these for each stream


  function CorkedRequest(state) {
    var _this = this;

    this.next = null;
    this.entry = null;

    this.finish = function (err) {
      var entry = _this.entry;
      _this.entry = null;

      while (entry) {
        var cb = entry.callback;
        state.pendingcb--;
        cb(err);
        entry = entry.next;
      }

      if (state.corkedRequestsFree) {
        state.corkedRequestsFree.next = _this;
      } else {
        state.corkedRequestsFree = _this;
      }
    };
  }

  inherits$1(Duplex, Readable);
  var keys = Object.keys(Writable.prototype);

  for (var v = 0; v < keys.length; v++) {
    var method = keys[v];
    if (!Duplex.prototype[method]) Duplex.prototype[method] = Writable.prototype[method];
  }
  function Duplex(options) {
    if (!(this instanceof Duplex)) return new Duplex(options);
    Readable.call(this, options);
    Writable.call(this, options);
    if (options && options.readable === false) this.readable = false;
    if (options && options.writable === false) this.writable = false;
    this.allowHalfOpen = true;
    if (options && options.allowHalfOpen === false) this.allowHalfOpen = false;
    this.once('end', onend);
  } // the no-half-open enforcer

  function onend() {
    // if we allow half-open state, or if the writable side ended,
    // then we're ok.
    if (this.allowHalfOpen || this._writableState.ended) return; // no more data can be written.
    // But allow more writes to happen in this tick.

    nextTick(onEndNT, this);
  }

  function onEndNT(self) {
    self.end();
  }

  // a transform stream is a readable/writable stream where you do
  inherits$1(Transform, Duplex);

  function TransformState(stream) {
    this.afterTransform = function (er, data) {
      return afterTransform(stream, er, data);
    };

    this.needTransform = false;
    this.transforming = false;
    this.writecb = null;
    this.writechunk = null;
    this.writeencoding = null;
  }

  function afterTransform(stream, er, data) {
    var ts = stream._transformState;
    ts.transforming = false;
    var cb = ts.writecb;
    if (!cb) return stream.emit('error', new Error('no writecb in Transform class'));
    ts.writechunk = null;
    ts.writecb = null;
    if (data !== null && data !== undefined) stream.push(data);
    cb(er);
    var rs = stream._readableState;
    rs.reading = false;

    if (rs.needReadable || rs.length < rs.highWaterMark) {
      stream._read(rs.highWaterMark);
    }
  }
  function Transform(options) {
    if (!(this instanceof Transform)) return new Transform(options);
    Duplex.call(this, options);
    this._transformState = new TransformState(this); // when the writable side finishes, then flush out anything remaining.

    var stream = this; // start out asking for a readable event once data is transformed.

    this._readableState.needReadable = true; // we have implemented the _read method, and done the other things
    // that Readable wants before the first _read call, so unset the
    // sync guard flag.

    this._readableState.sync = false;

    if (options) {
      if (typeof options.transform === 'function') this._transform = options.transform;
      if (typeof options.flush === 'function') this._flush = options.flush;
    }

    this.once('prefinish', function () {
      if (typeof this._flush === 'function') this._flush(function (er) {
        done(stream, er);
      });else done(stream);
    });
  }

  Transform.prototype.push = function (chunk, encoding) {
    this._transformState.needTransform = false;
    return Duplex.prototype.push.call(this, chunk, encoding);
  }; // This is the part where you do stuff!
  // override this function in implementation classes.
  // 'chunk' is an input chunk.
  //
  // Call `push(newChunk)` to pass along transformed output
  // to the readable side.  You may call 'push' zero or more times.
  //
  // Call `cb(err)` when you are done with this chunk.  If you pass
  // an error, then that'll put the hurt on the whole operation.  If you
  // never call cb(), then you'll never get another chunk.


  Transform.prototype._transform = function (chunk, encoding, cb) {
    throw new Error('Not implemented');
  };

  Transform.prototype._write = function (chunk, encoding, cb) {
    var ts = this._transformState;
    ts.writecb = cb;
    ts.writechunk = chunk;
    ts.writeencoding = encoding;

    if (!ts.transforming) {
      var rs = this._readableState;
      if (ts.needTransform || rs.needReadable || rs.length < rs.highWaterMark) this._read(rs.highWaterMark);
    }
  }; // Doesn't matter what the args are here.
  // _transform does all the work.
  // That we got here means that the readable side wants more data.


  Transform.prototype._read = function (n) {
    var ts = this._transformState;

    if (ts.writechunk !== null && ts.writecb && !ts.transforming) {
      ts.transforming = true;

      this._transform(ts.writechunk, ts.writeencoding, ts.afterTransform);
    } else {
      // mark that we need a transform, so that any data that comes in
      // will get processed, now that we've asked for it.
      ts.needTransform = true;
    }
  };

  function done(stream, er) {
    if (er) return stream.emit('error', er); // if there's nothing in the write buffer, then that means
    // that nothing more will ever be provided

    var ws = stream._writableState;
    var ts = stream._transformState;
    if (ws.length) throw new Error('Calling transform done when ws.length != 0');
    if (ts.transforming) throw new Error('Calling transform done when still transforming');
    return stream.push(null);
  }

  inherits$1(PassThrough, Transform);
  function PassThrough(options) {
    if (!(this instanceof PassThrough)) return new PassThrough(options);
    Transform.call(this, options);
  }

  PassThrough.prototype._transform = function (chunk, encoding, cb) {
    cb(null, chunk);
  };

  inherits$1(Stream, EventEmitter);
  Stream.Readable = Readable;
  Stream.Writable = Writable;
  Stream.Duplex = Duplex;
  Stream.Transform = Transform;
  Stream.PassThrough = PassThrough; // Backwards-compat with node 0.4.x

  Stream.Stream = Stream;
  // part of this class) is overridden in the Readable class.

  function Stream() {
    EventEmitter.call(this);
  }

  Stream.prototype.pipe = function (dest, options) {
    var source = this;

    function ondata(chunk) {
      if (dest.writable) {
        if (false === dest.write(chunk) && source.pause) {
          source.pause();
        }
      }
    }

    source.on('data', ondata);

    function ondrain() {
      if (source.readable && source.resume) {
        source.resume();
      }
    }

    dest.on('drain', ondrain); // If the 'end' option is not supplied, dest.end() will be called when
    // source gets the 'end' or 'close' events.  Only dest.end() once.

    if (!dest._isStdio && (!options || options.end !== false)) {
      source.on('end', onend);
      source.on('close', onclose);
    }

    var didOnEnd = false;

    function onend() {
      if (didOnEnd) return;
      didOnEnd = true;
      dest.end();
    }

    function onclose() {
      if (didOnEnd) return;
      didOnEnd = true;
      if (typeof dest.destroy === 'function') dest.destroy();
    } // don't leave dangling pipes when there are errors.


    function onerror(er) {
      cleanup();

      if (EventEmitter.listenerCount(this, 'error') === 0) {
        throw er; // Unhandled stream error in pipe.
      }
    }

    source.on('error', onerror);
    dest.on('error', onerror); // remove all the event listeners that were added.

    function cleanup() {
      source.removeListener('data', ondata);
      dest.removeListener('drain', ondrain);
      source.removeListener('end', onend);
      source.removeListener('close', onclose);
      source.removeListener('error', onerror);
      dest.removeListener('error', onerror);
      source.removeListener('end', cleanup);
      source.removeListener('close', cleanup);
      dest.removeListener('close', cleanup);
    }

    source.on('end', cleanup);
    source.on('close', cleanup);
    dest.on('close', cleanup);
    dest.emit('pipe', source); // Allow for unix-like usage: A.pipe(B).pipe(C)

    return dest;
  };

  var rStates = {
    UNSENT: 0,
    OPENED: 1,
    HEADERS_RECEIVED: 2,
    LOADING: 3,
    DONE: 4
  };
  function IncomingMessage(xhr, response, mode) {
    var self = this;
    Readable.call(self);
    self._mode = mode;
    self.headers = {};
    self.rawHeaders = [];
    self.trailers = {};
    self.rawTrailers = []; // Fake the 'close' event, but only once 'end' fires

    self.on('end', function () {
      // The nextTick is necessary to prevent the 'request' module from causing an infinite loop
      process.nextTick(function () {
        self.emit('close');
      });
    });
    var read;

    if (mode === 'fetch') {
      self._fetchResponse = response;
      self.url = response.url;
      self.statusCode = response.status;
      self.statusMessage = response.statusText; // backwards compatible version of for (<item> of <iterable>):
      // for (var <item>,_i,_it = <iterable>[Symbol.iterator](); <item> = (_i = _it.next()).value,!_i.done;)

      for (var header, _i, _it = response.headers[Symbol.iterator](); header = (_i = _it.next()).value, !_i.done;) {
        self.headers[header[0].toLowerCase()] = header[1];
        self.rawHeaders.push(header[0], header[1]);
      } // TODO: this doesn't respect backpressure. Once WritableStream is available, this can be fixed


      var reader = response.body.getReader();

      read = function () {
        reader.read().then(function (result) {
          if (self._destroyed) return;

          if (result.done) {
            self.push(null);
            return;
          }

          self.push(new Buffer(result.value));
          read();
        });
      };

      read();
    } else {
      self._xhr = xhr;
      self._pos = 0;
      self.url = xhr.responseURL;
      self.statusCode = xhr.status;
      self.statusMessage = xhr.statusText;
      var headers = xhr.getAllResponseHeaders().split(/\r?\n/);
      headers.forEach(function (header) {
        var matches = header.match(/^([^:]+):\s*(.*)/);

        if (matches) {
          var key = matches[1].toLowerCase();

          if (key === 'set-cookie') {
            if (self.headers[key] === undefined) {
              self.headers[key] = [];
            }

            self.headers[key].push(matches[2]);
          } else if (self.headers[key] !== undefined) {
            self.headers[key] += ', ' + matches[2];
          } else {
            self.headers[key] = matches[2];
          }

          self.rawHeaders.push(matches[1], matches[2]);
        }
      });
      self._charset = 'x-user-defined';

      if (!overrideMimeType) {
        var mimeType = self.rawHeaders['mime-type'];

        if (mimeType) {
          var charsetMatch = mimeType.match(/;\s*charset=([^;])(;|$)/);

          if (charsetMatch) {
            self._charset = charsetMatch[1].toLowerCase();
          }
        }

        if (!self._charset) self._charset = 'utf-8'; // best guess
      }
    }
  }
  inherits$1(IncomingMessage, Readable);

  IncomingMessage.prototype._read = function () {};

  IncomingMessage.prototype._onXHRProgress = function () {
    var self = this;
    var xhr = self._xhr;
    var response = null;

    switch (self._mode) {
      case 'text:vbarray':
        // For IE9
        if (xhr.readyState !== rStates.DONE) break;

        try {
          // This fails in IE8
          response = new global.VBArray(xhr.responseBody).toArray();
        } catch (e) {// pass
        }

        if (response !== null) {
          self.push(new Buffer(response));
          break;
        }

      // Falls through in IE8

      case 'text':
        try {
          // This will fail when readyState = 3 in IE9. Switch mode and wait for readyState = 4
          response = xhr.responseText;
        } catch (e) {
          self._mode = 'text:vbarray';
          break;
        }

        if (response.length > self._pos) {
          var newData = response.substr(self._pos);

          if (self._charset === 'x-user-defined') {
            var buffer = new Buffer(newData.length);

            for (var i = 0; i < newData.length; i++) buffer[i] = newData.charCodeAt(i) & 0xff;

            self.push(buffer);
          } else {
            self.push(newData, self._charset);
          }

          self._pos = response.length;
        }

        break;

      case 'arraybuffer':
        if (xhr.readyState !== rStates.DONE || !xhr.response) break;
        response = xhr.response;
        self.push(new Buffer(new Uint8Array(response)));
        break;

      case 'moz-chunked-arraybuffer':
        // take whole
        response = xhr.response;
        if (xhr.readyState !== rStates.LOADING || !response) break;
        self.push(new Buffer(new Uint8Array(response)));
        break;

      case 'ms-stream':
        response = xhr.response;
        if (xhr.readyState !== rStates.LOADING) break;
        var reader = new global.MSStreamReader();

        reader.onprogress = function () {
          if (reader.result.byteLength > self._pos) {
            self.push(new Buffer(new Uint8Array(reader.result.slice(self._pos))));
            self._pos = reader.result.byteLength;
          }
        };

        reader.onload = function () {
          self.push(null);
        }; // reader.onerror = ??? // TODO: this


        reader.readAsArrayBuffer(response);
        break;
    } // The ms-stream case handles end separately in reader.onload()


    if (self._xhr.readyState === rStates.DONE && self._mode !== 'ms-stream') {
      self.push(null);
    }
  };

  // from https://github.com/jhiesey/to-arraybuffer/blob/6502d9850e70ba7935a7df4ad86b358fc216f9f0/index.js
  function toArrayBuffer (buf) {
    // If the buffer is backed by a Uint8Array, a faster version will work
    if (buf instanceof Uint8Array) {
      // If the buffer isn't a subarray, return the underlying ArrayBuffer
      if (buf.byteOffset === 0 && buf.byteLength === buf.buffer.byteLength) {
        return buf.buffer;
      } else if (typeof buf.buffer.slice === 'function') {
        // Otherwise we need to get a proper copy
        return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
      }
    }

    if (isBuffer$1(buf)) {
      // This is the slow version that will work with any Buffer
      // implementation (even in old browsers)
      var arrayCopy = new Uint8Array(buf.length);
      var len = buf.length;

      for (var i = 0; i < len; i++) {
        arrayCopy[i] = buf[i];
      }

      return arrayCopy.buffer;
    } else {
      throw new Error('Argument must be a Buffer');
    }
  }

  function decideMode(preferBinary, useFetch) {
    if (hasFetch && useFetch) {
      return 'fetch';
    } else if (mozchunkedarraybuffer) {
      return 'moz-chunked-arraybuffer';
    } else if (msstream) {
      return 'ms-stream';
    } else if (arraybuffer && preferBinary) {
      return 'arraybuffer';
    } else if (vbArray && preferBinary) {
      return 'text:vbarray';
    } else {
      return 'text';
    }
  }

  function ClientRequest(opts) {
    var self = this;
    Writable.call(self);
    self._opts = opts;
    self._body = [];
    self._headers = {};
    if (opts.auth) self.setHeader('Authorization', 'Basic ' + new Buffer(opts.auth).toString('base64'));
    Object.keys(opts.headers).forEach(function (name) {
      self.setHeader(name, opts.headers[name]);
    });
    var preferBinary;
    var useFetch = true;

    if (opts.mode === 'disable-fetch') {
      // If the use of XHR should be preferred and includes preserving the 'content-type' header
      useFetch = false;
      preferBinary = true;
    } else if (opts.mode === 'prefer-streaming') {
      // If streaming is a high priority but binary compatibility and
      // the accuracy of the 'content-type' header aren't
      preferBinary = false;
    } else if (opts.mode === 'allow-wrong-content-type') {
      // If streaming is more important than preserving the 'content-type' header
      preferBinary = !overrideMimeType;
    } else if (!opts.mode || opts.mode === 'default' || opts.mode === 'prefer-fast') {
      // Use binary if text streaming may corrupt data or the content-type header, or for speed
      preferBinary = true;
    } else {
      throw new Error('Invalid value for opts.mode');
    }

    self._mode = decideMode(preferBinary, useFetch);
    self.on('finish', function () {
      self._onFinish();
    });
  }

  inherits$1(ClientRequest, Writable); // Taken from http://www.w3.org/TR/XMLHttpRequest/#the-setrequestheader%28%29-method

  var unsafeHeaders = ['accept-charset', 'accept-encoding', 'access-control-request-headers', 'access-control-request-method', 'connection', 'content-length', 'cookie', 'cookie2', 'date', 'dnt', 'expect', 'host', 'keep-alive', 'origin', 'referer', 'te', 'trailer', 'transfer-encoding', 'upgrade', 'user-agent', 'via'];

  ClientRequest.prototype.setHeader = function (name, value) {
    var self = this;
    var lowerName = name.toLowerCase(); // This check is not necessary, but it prevents warnings from browsers about setting unsafe
    // headers. To be honest I'm not entirely sure hiding these warnings is a good thing, but
    // http-browserify did it, so I will too.

    if (unsafeHeaders.indexOf(lowerName) !== -1) return;
    self._headers[lowerName] = {
      name: name,
      value: value
    };
  };

  ClientRequest.prototype.getHeader = function (name) {
    var self = this;
    return self._headers[name.toLowerCase()].value;
  };

  ClientRequest.prototype.removeHeader = function (name) {
    var self = this;
    delete self._headers[name.toLowerCase()];
  };

  ClientRequest.prototype._onFinish = function () {
    var self = this;
    if (self._destroyed) return;
    var opts = self._opts;
    var headersObj = self._headers;
    var body;

    if (opts.method === 'POST' || opts.method === 'PUT' || opts.method === 'PATCH') {
      if (blobConstructor()) {
        body = new global.Blob(self._body.map(function (buffer) {
          return toArrayBuffer(buffer);
        }), {
          type: (headersObj['content-type'] || {}).value || ''
        });
      } else {
        // get utf8 string
        body = Buffer.concat(self._body).toString();
      }
    }

    if (self._mode === 'fetch') {
      var headers = Object.keys(headersObj).map(function (name) {
        return [headersObj[name].name, headersObj[name].value];
      });
      global.fetch(self._opts.url, {
        method: self._opts.method,
        headers: headers,
        body: body,
        mode: 'cors',
        credentials: opts.withCredentials ? 'include' : 'same-origin'
      }).then(function (response) {
        self._fetchResponse = response;

        self._connect();
      }, function (reason) {
        self.emit('error', reason);
      });
    } else {
      var xhr = self._xhr = new global.XMLHttpRequest();

      try {
        xhr.open(self._opts.method, self._opts.url, true);
      } catch (err) {
        process.nextTick(function () {
          self.emit('error', err);
        });
        return;
      } // Can't set responseType on really old browsers


      if ('responseType' in xhr) xhr.responseType = self._mode.split(':')[0];
      if ('withCredentials' in xhr) xhr.withCredentials = !!opts.withCredentials;
      if (self._mode === 'text' && 'overrideMimeType' in xhr) xhr.overrideMimeType('text/plain; charset=x-user-defined');
      Object.keys(headersObj).forEach(function (name) {
        xhr.setRequestHeader(headersObj[name].name, headersObj[name].value);
      });
      self._response = null;

      xhr.onreadystatechange = function () {
        switch (xhr.readyState) {
          case rStates.LOADING:
          case rStates.DONE:
            self._onXHRProgress();

            break;
        }
      }; // Necessary for streaming in Firefox, since xhr.response is ONLY defined
      // in onprogress, not in onreadystatechange with xhr.readyState = 3


      if (self._mode === 'moz-chunked-arraybuffer') {
        xhr.onprogress = function () {
          self._onXHRProgress();
        };
      }

      xhr.onerror = function () {
        if (self._destroyed) return;
        self.emit('error', new Error('XHR error'));
      };

      try {
        xhr.send(body);
      } catch (err) {
        process.nextTick(function () {
          self.emit('error', err);
        });
        return;
      }
    }
  };
  /**
   * Checks if xhr.status is readable and non-zero, indicating no error.
   * Even though the spec says it should be available in readyState 3,
   * accessing it throws an exception in IE8
   */


  function statusValid(xhr) {
    try {
      var status = xhr.status;
      return status !== null && status !== 0;
    } catch (e) {
      return false;
    }
  }

  ClientRequest.prototype._onXHRProgress = function () {
    var self = this;
    if (!statusValid(self._xhr) || self._destroyed) return;
    if (!self._response) self._connect();

    self._response._onXHRProgress();
  };

  ClientRequest.prototype._connect = function () {
    var self = this;
    if (self._destroyed) return;
    self._response = new IncomingMessage(self._xhr, self._fetchResponse, self._mode);
    self.emit('response', self._response);
  };

  ClientRequest.prototype._write = function (chunk, encoding, cb) {
    var self = this;

    self._body.push(chunk);

    cb();
  };

  ClientRequest.prototype.abort = ClientRequest.prototype.destroy = function () {
    var self = this;
    self._destroyed = true;
    if (self._response) self._response._destroyed = true;
    if (self._xhr) self._xhr.abort(); // Currently, there isn't a way to truly abort a fetch.
    // If you like bikeshedding, see https://github.com/whatwg/fetch/issues/27
  };

  ClientRequest.prototype.end = function (data, encoding, cb) {
    var self = this;

    if (typeof data === 'function') {
      cb = data;
      data = undefined;
    }

    Writable.prototype.end.call(self, data, encoding, cb);
  };

  ClientRequest.prototype.flushHeaders = function () {};

  ClientRequest.prototype.setTimeout = function () {};

  ClientRequest.prototype.setNoDelay = function () {};

  ClientRequest.prototype.setSocketKeepAlive = function () {};

  /*! https://mths.be/punycode v1.4.1 by @mathias */

  /** Highest positive signed 32-bit float value */
  var maxInt = 2147483647; // aka. 0x7FFFFFFF or 2^31-1

  /** Bootstring parameters */

  var base = 36;
  var tMin = 1;
  var tMax = 26;
  var skew = 38;
  var damp = 700;
  var initialBias = 72;
  var initialN = 128; // 0x80

  var delimiter = '-'; // '\x2D'
  var regexNonASCII = /[^\x20-\x7E]/; // unprintable ASCII chars + non-ASCII chars

  var regexSeparators = /[\x2E\u3002\uFF0E\uFF61]/g; // RFC 3490 separators

  /** Error messages */

  var errors = {
    'overflow': 'Overflow: input needs wider integers to process',
    'not-basic': 'Illegal input >= 0x80 (not a basic code point)',
    'invalid-input': 'Invalid input'
  };
  /** Convenience shortcuts */

  var baseMinusTMin = base - tMin;
  var floor = Math.floor;
  var stringFromCharCode = String.fromCharCode;
  /*--------------------------------------------------------------------------*/

  /**
   * A generic error utility function.
   * @private
   * @param {String} type The error type.
   * @returns {Error} Throws a `RangeError` with the applicable error message.
   */

  function error(type) {
    throw new RangeError(errors[type]);
  }
  /**
   * A generic `Array#map` utility function.
   * @private
   * @param {Array} array The array to iterate over.
   * @param {Function} callback The function that gets called for every array
   * item.
   * @returns {Array} A new array of values returned by the callback function.
   */


  function map(array, fn) {
    var length = array.length;
    var result = [];

    while (length--) {
      result[length] = fn(array[length]);
    }

    return result;
  }
  /**
   * A simple `Array#map`-like wrapper to work with domain name strings or email
   * addresses.
   * @private
   * @param {String} domain The domain name or email address.
   * @param {Function} callback The function that gets called for every
   * character.
   * @returns {Array} A new string of characters returned by the callback
   * function.
   */


  function mapDomain(string, fn) {
    var parts = string.split('@');
    var result = '';

    if (parts.length > 1) {
      // In email addresses, only the domain name should be punycoded. Leave
      // the local part (i.e. everything up to `@`) intact.
      result = parts[0] + '@';
      string = parts[1];
    } // Avoid `split(regex)` for IE8 compatibility. See #17.


    string = string.replace(regexSeparators, '\x2E');
    var labels = string.split('.');
    var encoded = map(labels, fn).join('.');
    return result + encoded;
  }
  /**
   * Creates an array containing the numeric code points of each Unicode
   * character in the string. While JavaScript uses UCS-2 internally,
   * this function will convert a pair of surrogate halves (each of which
   * UCS-2 exposes as separate characters) into a single code point,
   * matching UTF-16.
   * @see `punycode.ucs2.encode`
   * @see <https://mathiasbynens.be/notes/javascript-encoding>
   * @memberOf punycode.ucs2
   * @name decode
   * @param {String} string The Unicode input string (UCS-2).
   * @returns {Array} The new array of code points.
   */


  function ucs2decode(string) {
    var output = [],
        counter = 0,
        length = string.length,
        value,
        extra;

    while (counter < length) {
      value = string.charCodeAt(counter++);

      if (value >= 0xD800 && value <= 0xDBFF && counter < length) {
        // high surrogate, and there is a next character
        extra = string.charCodeAt(counter++);

        if ((extra & 0xFC00) == 0xDC00) {
          // low surrogate
          output.push(((value & 0x3FF) << 10) + (extra & 0x3FF) + 0x10000);
        } else {
          // unmatched surrogate; only append this code unit, in case the next
          // code unit is the high surrogate of a surrogate pair
          output.push(value);
          counter--;
        }
      } else {
        output.push(value);
      }
    }

    return output;
  }
  /**
   * Converts a digit/integer into a basic code point.
   * @see `basicToDigit()`
   * @private
   * @param {Number} digit The numeric value of a basic code point.
   * @returns {Number} The basic code point whose value (when used for
   * representing integers) is `digit`, which needs to be in the range
   * `0` to `base - 1`. If `flag` is non-zero, the uppercase form is
   * used; else, the lowercase form is used. The behavior is undefined
   * if `flag` is non-zero and `digit` has no uppercase form.
   */


  function digitToBasic(digit, flag) {
    //  0..25 map to ASCII a..z or A..Z
    // 26..35 map to ASCII 0..9
    return digit + 22 + 75 * (digit < 26) - ((flag != 0) << 5);
  }
  /**
   * Bias adaptation function as per section 3.4 of RFC 3492.
   * https://tools.ietf.org/html/rfc3492#section-3.4
   * @private
   */


  function adapt(delta, numPoints, firstTime) {
    var k = 0;
    delta = firstTime ? floor(delta / damp) : delta >> 1;
    delta += floor(delta / numPoints);

    for (;
    /* no initialization */
    delta > baseMinusTMin * tMax >> 1; k += base) {
      delta = floor(delta / baseMinusTMin);
    }

    return floor(k + (baseMinusTMin + 1) * delta / (delta + skew));
  }
  /**
   * Converts a string of Unicode symbols (e.g. a domain name label) to a
   * Punycode string of ASCII-only symbols.
   * @memberOf punycode
   * @param {String} input The string of Unicode symbols.
   * @returns {String} The resulting Punycode string of ASCII-only symbols.
   */

  function encode(input) {
    var n,
        delta,
        handledCPCount,
        basicLength,
        bias,
        j,
        m,
        q,
        k,
        t,
        currentValue,
        output = [],

    /** `inputLength` will hold the number of code points in `input`. */
    inputLength,

    /** Cached calculation results */
    handledCPCountPlusOne,
        baseMinusT,
        qMinusT; // Convert the input in UCS-2 to Unicode

    input = ucs2decode(input); // Cache the length

    inputLength = input.length; // Initialize the state

    n = initialN;
    delta = 0;
    bias = initialBias; // Handle the basic code points

    for (j = 0; j < inputLength; ++j) {
      currentValue = input[j];

      if (currentValue < 0x80) {
        output.push(stringFromCharCode(currentValue));
      }
    }

    handledCPCount = basicLength = output.length; // `handledCPCount` is the number of code points that have been handled;
    // `basicLength` is the number of basic code points.
    // Finish the basic string - if it is not empty - with a delimiter

    if (basicLength) {
      output.push(delimiter);
    } // Main encoding loop:


    while (handledCPCount < inputLength) {
      // All non-basic code points < n have been handled already. Find the next
      // larger one:
      for (m = maxInt, j = 0; j < inputLength; ++j) {
        currentValue = input[j];

        if (currentValue >= n && currentValue < m) {
          m = currentValue;
        }
      } // Increase `delta` enough to advance the decoder's <n,i> state to <m,0>,
      // but guard against overflow


      handledCPCountPlusOne = handledCPCount + 1;

      if (m - n > floor((maxInt - delta) / handledCPCountPlusOne)) {
        error('overflow');
      }

      delta += (m - n) * handledCPCountPlusOne;
      n = m;

      for (j = 0; j < inputLength; ++j) {
        currentValue = input[j];

        if (currentValue < n && ++delta > maxInt) {
          error('overflow');
        }

        if (currentValue == n) {
          // Represent delta as a generalized variable-length integer
          for (q = delta, k = base;;
          /* no condition */
          k += base) {
            t = k <= bias ? tMin : k >= bias + tMax ? tMax : k - bias;

            if (q < t) {
              break;
            }

            qMinusT = q - t;
            baseMinusT = base - t;
            output.push(stringFromCharCode(digitToBasic(t + qMinusT % baseMinusT, 0)));
            q = floor(qMinusT / baseMinusT);
          }

          output.push(stringFromCharCode(digitToBasic(q, 0)));
          bias = adapt(delta, handledCPCountPlusOne, handledCPCount == basicLength);
          delta = 0;
          ++handledCPCount;
        }
      }

      ++delta;
      ++n;
    }

    return output.join('');
  }
  /**
   * Converts a Unicode string representing a domain name or an email address to
   * Punycode. Only the non-ASCII parts of the domain name will be converted,
   * i.e. it doesn't matter if you call it with a domain that's already in
   * ASCII.
   * @memberOf punycode
   * @param {String} input The domain name or email address to convert, as a
   * Unicode string.
   * @returns {String} The Punycode representation of the given domain name or
   * email address.
   */

  function toASCII(input) {
    return mapDomain(input, function (string) {
      return regexNonASCII.test(string) ? 'xn--' + encode(string) : string;
    });
  }

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
  // If obj.hasOwnProperty has been overridden, then calling
  // obj.hasOwnProperty(prop) will break.
  // See: https://github.com/joyent/node/issues/1707
  function hasOwnProperty$1(obj, prop) {
    return Object.prototype.hasOwnProperty.call(obj, prop);
  }

  var isArray$2 = Array.isArray || function (xs) {
    return Object.prototype.toString.call(xs) === '[object Array]';
  };

  function stringifyPrimitive(v) {
    switch (typeof v) {
      case 'string':
        return v;

      case 'boolean':
        return v ? 'true' : 'false';

      case 'number':
        return isFinite(v) ? v : '';

      default:
        return '';
    }
  }

  function stringify(obj, sep, eq, name) {
    sep = sep || '&';
    eq = eq || '=';

    if (obj === null) {
      obj = undefined;
    }

    if (typeof obj === 'object') {
      return map$1(objectKeys(obj), function (k) {
        var ks = encodeURIComponent(stringifyPrimitive(k)) + eq;

        if (isArray$2(obj[k])) {
          return map$1(obj[k], function (v) {
            return ks + encodeURIComponent(stringifyPrimitive(v));
          }).join(sep);
        } else {
          return ks + encodeURIComponent(stringifyPrimitive(obj[k]));
        }
      }).join(sep);
    }

    if (!name) return '';
    return encodeURIComponent(stringifyPrimitive(name)) + eq + encodeURIComponent(stringifyPrimitive(obj));
  }

  function map$1(xs, f) {
    if (xs.map) return xs.map(f);
    var res = [];

    for (var i = 0; i < xs.length; i++) {
      res.push(f(xs[i], i));
    }

    return res;
  }

  var objectKeys = Object.keys || function (obj) {
    var res = [];

    for (var key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) res.push(key);
    }

    return res;
  };

  function parse$1(qs, sep, eq, options) {
    sep = sep || '&';
    eq = eq || '=';
    var obj = {};

    if (typeof qs !== 'string' || qs.length === 0) {
      return obj;
    }

    var regexp = /\+/g;
    qs = qs.split(sep);
    var maxKeys = 1000;

    if (options && typeof options.maxKeys === 'number') {
      maxKeys = options.maxKeys;
    }

    var len = qs.length; // maxKeys <= 0 means that we should not limit keys count

    if (maxKeys > 0 && len > maxKeys) {
      len = maxKeys;
    }

    for (var i = 0; i < len; ++i) {
      var x = qs[i].replace(regexp, '%20'),
          idx = x.indexOf(eq),
          kstr,
          vstr,
          k,
          v;

      if (idx >= 0) {
        kstr = x.substr(0, idx);
        vstr = x.substr(idx + 1);
      } else {
        kstr = x;
        vstr = '';
      }

      k = decodeURIComponent(kstr);
      v = decodeURIComponent(vstr);

      if (!hasOwnProperty$1(obj, k)) {
        obj[k] = v;
      } else if (isArray$2(obj[k])) {
        obj[k].push(v);
      } else {
        obj[k] = [obj[k], v];
      }
    }

    return obj;
  }

  // Copyright Joyent, Inc. and other Node contributors.
  var Url = {
    parse: urlParse,
    resolve: urlResolve,
    resolveObject: urlResolveObject,
    format: urlFormat,
    Url: Url$1
  };
  function Url$1() {
    this.protocol = null;
    this.slashes = null;
    this.auth = null;
    this.host = null;
    this.port = null;
    this.hostname = null;
    this.hash = null;
    this.search = null;
    this.query = null;
    this.pathname = null;
    this.path = null;
    this.href = null;
  } // Reference: RFC 3986, RFC 1808, RFC 2396
  // define these here so at least they only have to be
  // compiled once on the first module load.

  var protocolPattern = /^([a-z0-9.+-]+:)/i,
      portPattern = /:[0-9]*$/,
      // Special case for a simple path URL
  simplePathPattern = /^(\/\/?(?!\/)[^\?\s]*)(\?[^\s]*)?$/,
      // RFC 2396: characters reserved for delimiting URLs.
  // We actually just auto-escape these.
  delims = ['<', '>', '"', '`', ' ', '\r', '\n', '\t'],
      // RFC 2396: characters not allowed for various reasons.
  unwise = ['{', '}', '|', '\\', '^', '`'].concat(delims),
      // Allowed by RFCs, but cause of XSS attacks.  Always escape these.
  autoEscape = ['\''].concat(unwise),
      // Characters that are never ever allowed in a hostname.
  // Note that any invalid chars are also handled, but these
  // are the ones that are *expected* to be seen, so we fast-path
  // them.
  nonHostChars = ['%', '/', '?', ';', '#'].concat(autoEscape),
      hostEndingChars = ['/', '?', '#'],
      hostnameMaxLen = 255,
      hostnamePartPattern = /^[+a-z0-9A-Z_-]{0,63}$/,
      hostnamePartStart = /^([+a-z0-9A-Z_-]{0,63})(.*)$/,
      // protocols that can allow "unsafe" and "unwise" chars.
  unsafeProtocol = {
    'javascript': true,
    'javascript:': true
  },
      // protocols that never have a hostname.
  hostlessProtocol = {
    'javascript': true,
    'javascript:': true
  },
      // protocols that always contain a // bit.
  slashedProtocol = {
    'http': true,
    'https': true,
    'ftp': true,
    'gopher': true,
    'file': true,
    'http:': true,
    'https:': true,
    'ftp:': true,
    'gopher:': true,
    'file:': true
  };

  function urlParse(url, parseQueryString, slashesDenoteHost) {
    if (url && isObject(url) && url instanceof Url$1) return url;
    var u = new Url$1();
    u.parse(url, parseQueryString, slashesDenoteHost);
    return u;
  }

  Url$1.prototype.parse = function (url, parseQueryString, slashesDenoteHost) {
    return parse$2(this, url, parseQueryString, slashesDenoteHost);
  };

  function parse$2(self, url, parseQueryString, slashesDenoteHost) {
    if (!isString(url)) {
      throw new TypeError('Parameter \'url\' must be a string, not ' + typeof url);
    } // Copy chrome, IE, opera backslash-handling behavior.
    // Back slashes before the query string get converted to forward slashes
    // See: https://code.google.com/p/chromium/issues/detail?id=25916


    var queryIndex = url.indexOf('?'),
        splitter = queryIndex !== -1 && queryIndex < url.indexOf('#') ? '?' : '#',
        uSplit = url.split(splitter),
        slashRegex = /\\/g;
    uSplit[0] = uSplit[0].replace(slashRegex, '/');
    url = uSplit.join(splitter);
    var rest = url; // trim before proceeding.
    // This is to support parse stuff like "  http://foo.com  \n"

    rest = rest.trim();

    if (!slashesDenoteHost && url.split('#').length === 1) {
      // Try fast path regexp
      var simplePath = simplePathPattern.exec(rest);

      if (simplePath) {
        self.path = rest;
        self.href = rest;
        self.pathname = simplePath[1];

        if (simplePath[2]) {
          self.search = simplePath[2];

          if (parseQueryString) {
            self.query = parse$1(self.search.substr(1));
          } else {
            self.query = self.search.substr(1);
          }
        } else if (parseQueryString) {
          self.search = '';
          self.query = {};
        }

        return self;
      }
    }

    var proto = protocolPattern.exec(rest);

    if (proto) {
      proto = proto[0];
      var lowerProto = proto.toLowerCase();
      self.protocol = lowerProto;
      rest = rest.substr(proto.length);
    } // figure out if it's got a host
    // user@server is *always* interpreted as a hostname, and url
    // resolution will treat //foo/bar as host=foo,path=bar because that's
    // how the browser resolves relative URLs.


    if (slashesDenoteHost || proto || rest.match(/^\/\/[^@\/]+@[^@\/]+/)) {
      var slashes = rest.substr(0, 2) === '//';

      if (slashes && !(proto && hostlessProtocol[proto])) {
        rest = rest.substr(2);
        self.slashes = true;
      }
    }

    var i, hec, l, p;

    if (!hostlessProtocol[proto] && (slashes || proto && !slashedProtocol[proto])) {
      // there's a hostname.
      // the first instance of /, ?, ;, or # ends the host.
      //
      // If there is an @ in the hostname, then non-host chars *are* allowed
      // to the left of the last @ sign, unless some host-ending character
      // comes *before* the @-sign.
      // URLs are obnoxious.
      //
      // ex:
      // http://a@b@c/ => user:a@b host:c
      // http://a@b?@c => user:a host:c path:/?@c
      // v0.12 TODO(isaacs): This is not quite how Chrome does things.
      // Review our test case against browsers more comprehensively.
      // find the first instance of any hostEndingChars
      var hostEnd = -1;

      for (i = 0; i < hostEndingChars.length; i++) {
        hec = rest.indexOf(hostEndingChars[i]);
        if (hec !== -1 && (hostEnd === -1 || hec < hostEnd)) hostEnd = hec;
      } // at this point, either we have an explicit point where the
      // auth portion cannot go past, or the last @ char is the decider.


      var auth, atSign;

      if (hostEnd === -1) {
        // atSign can be anywhere.
        atSign = rest.lastIndexOf('@');
      } else {
        // atSign must be in auth portion.
        // http://a@b/c@d => host:b auth:a path:/c@d
        atSign = rest.lastIndexOf('@', hostEnd);
      } // Now we have a portion which is definitely the auth.
      // Pull that off.


      if (atSign !== -1) {
        auth = rest.slice(0, atSign);
        rest = rest.slice(atSign + 1);
        self.auth = decodeURIComponent(auth);
      } // the host is the remaining to the left of the first non-host char


      hostEnd = -1;

      for (i = 0; i < nonHostChars.length; i++) {
        hec = rest.indexOf(nonHostChars[i]);
        if (hec !== -1 && (hostEnd === -1 || hec < hostEnd)) hostEnd = hec;
      } // if we still have not hit it, then the entire thing is a host.


      if (hostEnd === -1) hostEnd = rest.length;
      self.host = rest.slice(0, hostEnd);
      rest = rest.slice(hostEnd); // pull out port.

      parseHost(self); // we've indicated that there is a hostname,
      // so even if it's empty, it has to be present.

      self.hostname = self.hostname || ''; // if hostname begins with [ and ends with ]
      // assume that it's an IPv6 address.

      var ipv6Hostname = self.hostname[0] === '[' && self.hostname[self.hostname.length - 1] === ']'; // validate a little.

      if (!ipv6Hostname) {
        var hostparts = self.hostname.split(/\./);

        for (i = 0, l = hostparts.length; i < l; i++) {
          var part = hostparts[i];
          if (!part) continue;

          if (!part.match(hostnamePartPattern)) {
            var newpart = '';

            for (var j = 0, k = part.length; j < k; j++) {
              if (part.charCodeAt(j) > 127) {
                // we replace non-ASCII char with a temporary placeholder
                // we need this to make sure size of hostname is not
                // broken by replacing non-ASCII by nothing
                newpart += 'x';
              } else {
                newpart += part[j];
              }
            } // we test again with ASCII char only


            if (!newpart.match(hostnamePartPattern)) {
              var validParts = hostparts.slice(0, i);
              var notHost = hostparts.slice(i + 1);
              var bit = part.match(hostnamePartStart);

              if (bit) {
                validParts.push(bit[1]);
                notHost.unshift(bit[2]);
              }

              if (notHost.length) {
                rest = '/' + notHost.join('.') + rest;
              }

              self.hostname = validParts.join('.');
              break;
            }
          }
        }
      }

      if (self.hostname.length > hostnameMaxLen) {
        self.hostname = '';
      } else {
        // hostnames are always lower case.
        self.hostname = self.hostname.toLowerCase();
      }

      if (!ipv6Hostname) {
        // IDNA Support: Returns a punycoded representation of "domain".
        // It only converts parts of the domain name that
        // have non-ASCII characters, i.e. it doesn't matter if
        // you call it with a domain that already is ASCII-only.
        self.hostname = toASCII(self.hostname);
      }

      p = self.port ? ':' + self.port : '';
      var h = self.hostname || '';
      self.host = h + p;
      self.href += self.host; // strip [ and ] from the hostname
      // the host field still retains them, though

      if (ipv6Hostname) {
        self.hostname = self.hostname.substr(1, self.hostname.length - 2);

        if (rest[0] !== '/') {
          rest = '/' + rest;
        }
      }
    } // now rest is set to the post-host stuff.
    // chop off any delim chars.


    if (!unsafeProtocol[lowerProto]) {
      // First, make 100% sure that any "autoEscape" chars get
      // escaped, even if encodeURIComponent doesn't think they
      // need to be.
      for (i = 0, l = autoEscape.length; i < l; i++) {
        var ae = autoEscape[i];
        if (rest.indexOf(ae) === -1) continue;
        var esc = encodeURIComponent(ae);

        if (esc === ae) {
          esc = escape(ae);
        }

        rest = rest.split(ae).join(esc);
      }
    } // chop off from the tail first.


    var hash = rest.indexOf('#');

    if (hash !== -1) {
      // got a fragment string.
      self.hash = rest.substr(hash);
      rest = rest.slice(0, hash);
    }

    var qm = rest.indexOf('?');

    if (qm !== -1) {
      self.search = rest.substr(qm);
      self.query = rest.substr(qm + 1);

      if (parseQueryString) {
        self.query = parse$1(self.query);
      }

      rest = rest.slice(0, qm);
    } else if (parseQueryString) {
      // no query string, but parseQueryString still requested
      self.search = '';
      self.query = {};
    }

    if (rest) self.pathname = rest;

    if (slashedProtocol[lowerProto] && self.hostname && !self.pathname) {
      self.pathname = '/';
    } //to support http.request


    if (self.pathname || self.search) {
      p = self.pathname || '';
      var s = self.search || '';
      self.path = p + s;
    } // finally, reconstruct the href based on what has been validated.


    self.href = format$1(self);
    return self;
  } // format a parsed object into a url string


  function urlFormat(obj) {
    // ensure it's an object, and not a string url.
    // If it's an obj, this is a no-op.
    // this way, you can call url_format() on strings
    // to clean up potentially wonky urls.
    if (isString(obj)) obj = parse$2({}, obj);
    return format$1(obj);
  }

  function format$1(self) {
    var auth = self.auth || '';

    if (auth) {
      auth = encodeURIComponent(auth);
      auth = auth.replace(/%3A/i, ':');
      auth += '@';
    }

    var protocol = self.protocol || '',
        pathname = self.pathname || '',
        hash = self.hash || '',
        host = false,
        query = '';

    if (self.host) {
      host = auth + self.host;
    } else if (self.hostname) {
      host = auth + (self.hostname.indexOf(':') === -1 ? self.hostname : '[' + this.hostname + ']');

      if (self.port) {
        host += ':' + self.port;
      }
    }

    if (self.query && isObject(self.query) && Object.keys(self.query).length) {
      query = stringify(self.query);
    }

    var search = self.search || query && '?' + query || '';
    if (protocol && protocol.substr(-1) !== ':') protocol += ':'; // only the slashedProtocols get the //.  Not mailto:, xmpp:, etc.
    // unless they had them to begin with.

    if (self.slashes || (!protocol || slashedProtocol[protocol]) && host !== false) {
      host = '//' + (host || '');
      if (pathname && pathname.charAt(0) !== '/') pathname = '/' + pathname;
    } else if (!host) {
      host = '';
    }

    if (hash && hash.charAt(0) !== '#') hash = '#' + hash;
    if (search && search.charAt(0) !== '?') search = '?' + search;
    pathname = pathname.replace(/[?#]/g, function (match) {
      return encodeURIComponent(match);
    });
    search = search.replace('#', '%23');
    return protocol + host + pathname + search + hash;
  }

  Url$1.prototype.format = function () {
    return format$1(this);
  };

  function urlResolve(source, relative) {
    return urlParse(source, false, true).resolve(relative);
  }

  Url$1.prototype.resolve = function (relative) {
    return this.resolveObject(urlParse(relative, false, true)).format();
  };

  function urlResolveObject(source, relative) {
    if (!source) return relative;
    return urlParse(source, false, true).resolveObject(relative);
  }

  Url$1.prototype.resolveObject = function (relative) {
    if (isString(relative)) {
      var rel = new Url$1();
      rel.parse(relative, false, true);
      relative = rel;
    }

    var result = new Url$1();
    var tkeys = Object.keys(this);

    for (var tk = 0; tk < tkeys.length; tk++) {
      var tkey = tkeys[tk];
      result[tkey] = this[tkey];
    } // hash is always overridden, no matter what.
    // even href="" will remove it.


    result.hash = relative.hash; // if the relative url is empty, then there's nothing left to do here.

    if (relative.href === '') {
      result.href = result.format();
      return result;
    } // hrefs like //foo/bar always cut to the protocol.


    if (relative.slashes && !relative.protocol) {
      // take everything except the protocol from relative
      var rkeys = Object.keys(relative);

      for (var rk = 0; rk < rkeys.length; rk++) {
        var rkey = rkeys[rk];
        if (rkey !== 'protocol') result[rkey] = relative[rkey];
      } //urlParse appends trailing / to urls like http://www.example.com


      if (slashedProtocol[result.protocol] && result.hostname && !result.pathname) {
        result.path = result.pathname = '/';
      }

      result.href = result.format();
      return result;
    }

    var relPath;

    if (relative.protocol && relative.protocol !== result.protocol) {
      // if it's a known url protocol, then changing
      // the protocol does weird things
      // first, if it's not file:, then we MUST have a host,
      // and if there was a path
      // to begin with, then we MUST have a path.
      // if it is file:, then the host is dropped,
      // because that's known to be hostless.
      // anything else is assumed to be absolute.
      if (!slashedProtocol[relative.protocol]) {
        var keys = Object.keys(relative);

        for (var v = 0; v < keys.length; v++) {
          var k = keys[v];
          result[k] = relative[k];
        }

        result.href = result.format();
        return result;
      }

      result.protocol = relative.protocol;

      if (!relative.host && !hostlessProtocol[relative.protocol]) {
        relPath = (relative.pathname || '').split('/');

        while (relPath.length && !(relative.host = relPath.shift()));

        if (!relative.host) relative.host = '';
        if (!relative.hostname) relative.hostname = '';
        if (relPath[0] !== '') relPath.unshift('');
        if (relPath.length < 2) relPath.unshift('');
        result.pathname = relPath.join('/');
      } else {
        result.pathname = relative.pathname;
      }

      result.search = relative.search;
      result.query = relative.query;
      result.host = relative.host || '';
      result.auth = relative.auth;
      result.hostname = relative.hostname || relative.host;
      result.port = relative.port; // to support http.request

      if (result.pathname || result.search) {
        var p = result.pathname || '';
        var s = result.search || '';
        result.path = p + s;
      }

      result.slashes = result.slashes || relative.slashes;
      result.href = result.format();
      return result;
    }

    var isSourceAbs = result.pathname && result.pathname.charAt(0) === '/',
        isRelAbs = relative.host || relative.pathname && relative.pathname.charAt(0) === '/',
        mustEndAbs = isRelAbs || isSourceAbs || result.host && relative.pathname,
        removeAllDots = mustEndAbs,
        srcPath = result.pathname && result.pathname.split('/') || [],
        psychotic = result.protocol && !slashedProtocol[result.protocol];
    relPath = relative.pathname && relative.pathname.split('/') || []; // if the url is a non-slashed url, then relative
    // links like ../.. should be able
    // to crawl up to the hostname, as well.  This is strange.
    // result.protocol has already been set by now.
    // Later on, put the first path part into the host field.

    if (psychotic) {
      result.hostname = '';
      result.port = null;

      if (result.host) {
        if (srcPath[0] === '') srcPath[0] = result.host;else srcPath.unshift(result.host);
      }

      result.host = '';

      if (relative.protocol) {
        relative.hostname = null;
        relative.port = null;

        if (relative.host) {
          if (relPath[0] === '') relPath[0] = relative.host;else relPath.unshift(relative.host);
        }

        relative.host = null;
      }

      mustEndAbs = mustEndAbs && (relPath[0] === '' || srcPath[0] === '');
    }

    var authInHost;

    if (isRelAbs) {
      // it's absolute.
      result.host = relative.host || relative.host === '' ? relative.host : result.host;
      result.hostname = relative.hostname || relative.hostname === '' ? relative.hostname : result.hostname;
      result.search = relative.search;
      result.query = relative.query;
      srcPath = relPath; // fall through to the dot-handling below.
    } else if (relPath.length) {
      // it's relative
      // throw away the existing file, and take the new path instead.
      if (!srcPath) srcPath = [];
      srcPath.pop();
      srcPath = srcPath.concat(relPath);
      result.search = relative.search;
      result.query = relative.query;
    } else if (!isNullOrUndefined(relative.search)) {
      // just pull out the search.
      // like href='?foo'.
      // Put this after the other two cases because it simplifies the booleans
      if (psychotic) {
        result.hostname = result.host = srcPath.shift(); //occationaly the auth can get stuck only in host
        //this especially happens in cases like
        //url.resolveObject('mailto:local1@domain1', 'local2@domain2')

        authInHost = result.host && result.host.indexOf('@') > 0 ? result.host.split('@') : false;

        if (authInHost) {
          result.auth = authInHost.shift();
          result.host = result.hostname = authInHost.shift();
        }
      }

      result.search = relative.search;
      result.query = relative.query; //to support http.request

      if (!isNull(result.pathname) || !isNull(result.search)) {
        result.path = (result.pathname ? result.pathname : '') + (result.search ? result.search : '');
      }

      result.href = result.format();
      return result;
    }

    if (!srcPath.length) {
      // no path at all.  easy.
      // we've already handled the other stuff above.
      result.pathname = null; //to support http.request

      if (result.search) {
        result.path = '/' + result.search;
      } else {
        result.path = null;
      }

      result.href = result.format();
      return result;
    } // if a url ENDs in . or .., then it must get a trailing slash.
    // however, if it ends in anything else non-slashy,
    // then it must NOT get a trailing slash.


    var last = srcPath.slice(-1)[0];
    var hasTrailingSlash = (result.host || relative.host || srcPath.length > 1) && (last === '.' || last === '..') || last === ''; // strip single dots, resolve double dots to parent dir
    // if the path tries to go above the root, `up` ends up > 0

    var up = 0;

    for (var i = srcPath.length; i >= 0; i--) {
      last = srcPath[i];

      if (last === '.') {
        srcPath.splice(i, 1);
      } else if (last === '..') {
        srcPath.splice(i, 1);
        up++;
      } else if (up) {
        srcPath.splice(i, 1);
        up--;
      }
    } // if the path is allowed to go above the root, restore leading ..s


    if (!mustEndAbs && !removeAllDots) {
      for (; up--; up) {
        srcPath.unshift('..');
      }
    }

    if (mustEndAbs && srcPath[0] !== '' && (!srcPath[0] || srcPath[0].charAt(0) !== '/')) {
      srcPath.unshift('');
    }

    if (hasTrailingSlash && srcPath.join('/').substr(-1) !== '/') {
      srcPath.push('');
    }

    var isAbsolute = srcPath[0] === '' || srcPath[0] && srcPath[0].charAt(0) === '/'; // put the host back

    if (psychotic) {
      result.hostname = result.host = isAbsolute ? '' : srcPath.length ? srcPath.shift() : ''; //occationaly the auth can get stuck only in host
      //this especially happens in cases like
      //url.resolveObject('mailto:local1@domain1', 'local2@domain2')

      authInHost = result.host && result.host.indexOf('@') > 0 ? result.host.split('@') : false;

      if (authInHost) {
        result.auth = authInHost.shift();
        result.host = result.hostname = authInHost.shift();
      }
    }

    mustEndAbs = mustEndAbs || result.host && srcPath.length;

    if (mustEndAbs && !isAbsolute) {
      srcPath.unshift('');
    }

    if (!srcPath.length) {
      result.pathname = null;
      result.path = null;
    } else {
      result.pathname = srcPath.join('/');
    } //to support request.http


    if (!isNull(result.pathname) || !isNull(result.search)) {
      result.path = (result.pathname ? result.pathname : '') + (result.search ? result.search : '');
    }

    result.auth = relative.auth || result.auth;
    result.slashes = result.slashes || relative.slashes;
    result.href = result.format();
    return result;
  };

  Url$1.prototype.parseHost = function () {
    return parseHost(this);
  };

  function parseHost(self) {
    var host = self.host;
    var port = portPattern.exec(host);

    if (port) {
      port = port[0];

      if (port !== ':') {
        self.port = port.substr(1);
      }

      host = host.substr(0, host.length - port.length);
    }

    if (host) self.hostname = host;
  }

  /*
  this and http-lib folder

  The MIT License

  Copyright (c) 2015 John Hiesey

  Permission is hereby granted, free of charge,
  to any person obtaining a copy of this software and
  associated documentation files (the "Software"), to
  deal in the Software without restriction, including
  without limitation the rights to use, copy, modify,
  merge, publish, distribute, sublicense, and/or sell
  copies of the Software, and to permit persons to whom
  the Software is furnished to do so,
  subject to the following conditions:

  The above copyright notice and this permission notice
  shall be included in all copies or substantial portions of the Software.

  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
  EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
  OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
  IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR
  ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
  TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
  SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

  */
  function request(opts, cb) {
    if (typeof opts === 'string') opts = urlParse(opts); // Normally, the page is loaded from http or https, so not specifying a protocol
    // will result in a (valid) protocol-relative url. However, this won't work if
    // the protocol is something else, like 'file:'

    var defaultProtocol = global.location.protocol.search(/^https?:$/) === -1 ? 'http:' : '';
    var protocol = opts.protocol || defaultProtocol;
    var host = opts.hostname || opts.host;
    var port = opts.port;
    var path = opts.path || '/'; // Necessary for IPv6 addresses

    if (host && host.indexOf(':') !== -1) host = '[' + host + ']'; // This may be a relative url. The browser should always be able to interpret it correctly.

    opts.url = (host ? protocol + '//' + host : '') + (port ? ':' + port : '') + path;
    opts.method = (opts.method || 'GET').toUpperCase();
    opts.headers = opts.headers || {}; // Also valid opts.auth, opts.mode

    var req = new ClientRequest(opts);
    if (cb) req.on('response', cb);
    return req;
  }
  function get(opts, cb) {
    var req = request(opts, cb);
    req.end();
    return req;
  }
  function Agent() {}
  Agent.defaultMaxSockets = 4;
  var METHODS = ['CHECKOUT', 'CONNECT', 'COPY', 'DELETE', 'GET', 'HEAD', 'LOCK', 'M-SEARCH', 'MERGE', 'MKACTIVITY', 'MKCOL', 'MOVE', 'NOTIFY', 'OPTIONS', 'PATCH', 'POST', 'PROPFIND', 'PROPPATCH', 'PURGE', 'PUT', 'REPORT', 'SEARCH', 'SUBSCRIBE', 'TRACE', 'UNLOCK', 'UNSUBSCRIBE'];
  var STATUS_CODES = {
    100: 'Continue',
    101: 'Switching Protocols',
    102: 'Processing',
    // RFC 2518, obsoleted by RFC 4918
    200: 'OK',
    201: 'Created',
    202: 'Accepted',
    203: 'Non-Authoritative Information',
    204: 'No Content',
    205: 'Reset Content',
    206: 'Partial Content',
    207: 'Multi-Status',
    // RFC 4918
    300: 'Multiple Choices',
    301: 'Moved Permanently',
    302: 'Moved Temporarily',
    303: 'See Other',
    304: 'Not Modified',
    305: 'Use Proxy',
    307: 'Temporary Redirect',
    400: 'Bad Request',
    401: 'Unauthorized',
    402: 'Payment Required',
    403: 'Forbidden',
    404: 'Not Found',
    405: 'Method Not Allowed',
    406: 'Not Acceptable',
    407: 'Proxy Authentication Required',
    408: 'Request Time-out',
    409: 'Conflict',
    410: 'Gone',
    411: 'Length Required',
    412: 'Precondition Failed',
    413: 'Request Entity Too Large',
    414: 'Request-URI Too Large',
    415: 'Unsupported Media Type',
    416: 'Requested Range Not Satisfiable',
    417: 'Expectation Failed',
    418: 'I\'m a teapot',
    // RFC 2324
    422: 'Unprocessable Entity',
    // RFC 4918
    423: 'Locked',
    // RFC 4918
    424: 'Failed Dependency',
    // RFC 4918
    425: 'Unordered Collection',
    // RFC 4918
    426: 'Upgrade Required',
    // RFC 2817
    428: 'Precondition Required',
    // RFC 6585
    429: 'Too Many Requests',
    // RFC 6585
    431: 'Request Header Fields Too Large',
    // RFC 6585
    500: 'Internal Server Error',
    501: 'Not Implemented',
    502: 'Bad Gateway',
    503: 'Service Unavailable',
    504: 'Gateway Time-out',
    505: 'HTTP Version Not Supported',
    506: 'Variant Also Negotiates',
    // RFC 2295
    507: 'Insufficient Storage',
    // RFC 4918
    509: 'Bandwidth Limit Exceeded',
    510: 'Not Extended',
    // RFC 2774
    511: 'Network Authentication Required' // RFC 6585

  };
  var http = {
    request,
    get,
    Agent,
    METHODS,
    STATUS_CODES
  };

  var require$$0$1 = {};

  function Queue(options) {
    if (!(this instanceof Queue)) {
      return new Queue(options);
    }

    options = options || {};
    this.concurrency = options.concurrency || Infinity;
    this.pending = 0;
    this.jobs = [];
    this.cbs = [];
    this._done = done$1.bind(this);
  }

  var arrayAddMethods = ['push', 'unshift', 'splice'];
  arrayAddMethods.forEach(function (method) {
    Queue.prototype[method] = function () {
      var methodResult = Array.prototype[method].apply(this.jobs, arguments);

      this._run();

      return methodResult;
    };
  });
  Object.defineProperty(Queue.prototype, 'length', {
    get: function () {
      return this.pending + this.jobs.length;
    }
  });

  Queue.prototype._run = function () {
    if (this.pending === this.concurrency) {
      return;
    }

    if (this.jobs.length) {
      var job = this.jobs.shift();
      this.pending++;
      job(this._done);

      this._run();
    }

    if (this.pending === 0) {
      while (this.cbs.length !== 0) {
        var cb = this.cbs.pop();
        process.nextTick(cb);
      }
    }
  };

  Queue.prototype.onDone = function (cb) {
    if (typeof cb === 'function') {
      this.cbs.push(cb);

      this._run();
    }
  };

  function done$1() {
    this.pending--;

    this._run();
  }

  var asyncLimiter = Queue;

  var msg = {
    2: 'need dictionary',

    /* Z_NEED_DICT       2  */
    1: 'stream end',

    /* Z_STREAM_END      1  */
    0: '',

    /* Z_OK              0  */
    '-1': 'file error',

    /* Z_ERRNO         (-1) */
    '-2': 'stream error',

    /* Z_STREAM_ERROR  (-2) */
    '-3': 'data error',

    /* Z_DATA_ERROR    (-3) */
    '-4': 'insufficient memory',

    /* Z_MEM_ERROR     (-4) */
    '-5': 'buffer error',

    /* Z_BUF_ERROR     (-5) */
    '-6': 'incompatible version'
    /* Z_VERSION_ERROR (-6) */

  };

  function ZStream() {
    /* next input byte */
    this.input = null; // JS specific, because we have no pointers

    this.next_in = 0;
    /* number of bytes available at input */

    this.avail_in = 0;
    /* total number of input bytes read so far */

    this.total_in = 0;
    /* next output byte should be put there */

    this.output = null; // JS specific, because we have no pointers

    this.next_out = 0;
    /* remaining free space at output */

    this.avail_out = 0;
    /* total number of bytes output so far */

    this.total_out = 0;
    /* last error message, NULL if no error */

    this.msg = ''
    /*Z_NULL*/
    ;
    /* not visible by applications */

    this.state = null;
    /* best guess about the data type: binary or text */

    this.data_type = 2
    /*Z_UNKNOWN*/
    ;
    /* adler32 value of the uncompressed data */

    this.adler = 0;
  }

  function arraySet(dest, src, src_offs, len, dest_offs) {
    if (src.subarray && dest.subarray) {
      dest.set(src.subarray(src_offs, src_offs + len), dest_offs);
      return;
    } // Fallback to ordinary array


    for (var i = 0; i < len; i++) {
      dest[dest_offs + i] = src[src_offs + i];
    }
  }
  var Buf8 = Uint8Array;
  var Buf16 = Uint16Array;
  var Buf32 = Int32Array; // Enable/Disable typed arrays use, for testing
  //

  /* Public constants ==========================================================*/

  /* ===========================================================================*/
  //var Z_FILTERED          = 1;
  //var Z_HUFFMAN_ONLY      = 2;
  //var Z_RLE               = 3;

  var Z_FIXED = 4; //var Z_DEFAULT_STRATEGY  = 0;

  /* Possible values of the data_type field (though see inflate()) */

  var Z_BINARY = 0;
  var Z_TEXT = 1; //var Z_ASCII             = 1; // = Z_TEXT

  var Z_UNKNOWN = 2;
  /*============================================================================*/

  function zero(buf) {
    var len = buf.length;

    while (--len >= 0) {
      buf[len] = 0;
    }
  } // From zutil.h


  var STORED_BLOCK = 0;
  var STATIC_TREES = 1;
  var DYN_TREES = 2;
  /* The three kinds of block type */

  var MIN_MATCH = 3;
  var MAX_MATCH = 258;
  /* The minimum and maximum match lengths */
  // From deflate.h

  /* ===========================================================================
   * Internal compression state.
   */

  var LENGTH_CODES = 29;
  /* number of length codes, not counting the special END_BLOCK code */

  var LITERALS = 256;
  /* number of literal bytes 0..255 */

  var L_CODES = LITERALS + 1 + LENGTH_CODES;
  /* number of Literal or Length codes, including the END_BLOCK code */

  var D_CODES = 30;
  /* number of distance codes */

  var BL_CODES = 19;
  /* number of codes used to transfer the bit lengths */

  var HEAP_SIZE = 2 * L_CODES + 1;
  /* maximum heap size */

  var MAX_BITS = 15;
  /* All codes must not exceed MAX_BITS bits */

  var Buf_size = 16;
  /* size of bit buffer in bi_buf */

  /* ===========================================================================
   * Constants
   */

  var MAX_BL_BITS = 7;
  /* Bit length codes must not exceed MAX_BL_BITS bits */

  var END_BLOCK = 256;
  /* end of block literal code */

  var REP_3_6 = 16;
  /* repeat previous bit length 3-6 times (2 bits of repeat count) */

  var REPZ_3_10 = 17;
  /* repeat a zero length 3-10 times  (3 bits of repeat count) */

  var REPZ_11_138 = 18;
  /* repeat a zero length 11-138 times  (7 bits of repeat count) */

  /* eslint-disable comma-spacing,array-bracket-spacing */

  var extra_lbits =
  /* extra bits for each length code */
  [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0];
  var extra_dbits =
  /* extra bits for each distance code */
  [0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13];
  var extra_blbits =
  /* extra bits for each bit length code */
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 3, 7];
  var bl_order = [16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15];
  /* eslint-enable comma-spacing,array-bracket-spacing */

  /* The lengths of the bit length codes are sent in order of decreasing
   * probability, to avoid transmitting the lengths for unused bit length codes.
   */

  /* ===========================================================================
   * Local data. These are initialized only once.
   */
  // We pre-fill arrays with 0 to avoid uninitialized gaps

  var DIST_CODE_LEN = 512;
  /* see definition of array dist_code below */
  // !!!! Use flat array insdead of structure, Freq = i*2, Len = i*2+1

  var static_ltree = new Array((L_CODES + 2) * 2);
  zero(static_ltree);
  /* The static literal tree. Since the bit lengths are imposed, there is no
   * need for the L_CODES extra codes used during heap construction. However
   * The codes 286 and 287 are needed to build a canonical tree (see _tr_init
   * below).
   */

  var static_dtree = new Array(D_CODES * 2);
  zero(static_dtree);
  /* The static distance tree. (Actually a trivial tree since all codes use
   * 5 bits.)
   */

  var _dist_code = new Array(DIST_CODE_LEN);

  zero(_dist_code);
  /* Distance codes. The first 256 values correspond to the distances
   * 3 .. 258, the last 256 values correspond to the top 8 bits of
   * the 15 bit distances.
   */

  var _length_code = new Array(MAX_MATCH - MIN_MATCH + 1);

  zero(_length_code);
  /* length code for each normalized match length (0 == MIN_MATCH) */

  var base_length = new Array(LENGTH_CODES);
  zero(base_length);
  /* First normalized length for each code (0 = MIN_MATCH) */

  var base_dist = new Array(D_CODES);
  zero(base_dist);
  /* First normalized distance for each code (0 = distance of 1) */

  function StaticTreeDesc(static_tree, extra_bits, extra_base, elems, max_length) {
    this.static_tree = static_tree;
    /* static tree or NULL */

    this.extra_bits = extra_bits;
    /* extra bits for each code or NULL */

    this.extra_base = extra_base;
    /* base index for extra_bits */

    this.elems = elems;
    /* max number of elements in the tree */

    this.max_length = max_length;
    /* max bit length for the codes */
    // show if `static_tree` has data or dummy - needed for monomorphic objects

    this.has_stree = static_tree && static_tree.length;
  }

  var static_l_desc;
  var static_d_desc;
  var static_bl_desc;

  function TreeDesc(dyn_tree, stat_desc) {
    this.dyn_tree = dyn_tree;
    /* the dynamic tree */

    this.max_code = 0;
    /* largest code with non zero frequency */

    this.stat_desc = stat_desc;
    /* the corresponding static tree */
  }

  function d_code(dist) {
    return dist < 256 ? _dist_code[dist] : _dist_code[256 + (dist >>> 7)];
  }
  /* ===========================================================================
   * Output a short LSB first on the stream.
   * IN assertion: there is enough room in pendingBuf.
   */


  function put_short(s, w) {
    //    put_byte(s, (uch)((w) & 0xff));
    //    put_byte(s, (uch)((ush)(w) >> 8));
    s.pending_buf[s.pending++] = w & 0xff;
    s.pending_buf[s.pending++] = w >>> 8 & 0xff;
  }
  /* ===========================================================================
   * Send a value on a given number of bits.
   * IN assertion: length <= 16 and value fits in length bits.
   */


  function send_bits(s, value, length) {
    if (s.bi_valid > Buf_size - length) {
      s.bi_buf |= value << s.bi_valid & 0xffff;
      put_short(s, s.bi_buf);
      s.bi_buf = value >> Buf_size - s.bi_valid;
      s.bi_valid += length - Buf_size;
    } else {
      s.bi_buf |= value << s.bi_valid & 0xffff;
      s.bi_valid += length;
    }
  }

  function send_code(s, c, tree) {
    send_bits(s, tree[c * 2]
    /*.Code*/
    , tree[c * 2 + 1]
    /*.Len*/
    );
  }
  /* ===========================================================================
   * Reverse the first len bits of a code, using straightforward code (a faster
   * method would use a table)
   * IN assertion: 1 <= len <= 15
   */


  function bi_reverse(code, len) {
    var res = 0;

    do {
      res |= code & 1;
      code >>>= 1;
      res <<= 1;
    } while (--len > 0);

    return res >>> 1;
  }
  /* ===========================================================================
   * Flush the bit buffer, keeping at most 7 bits in it.
   */


  function bi_flush(s) {
    if (s.bi_valid === 16) {
      put_short(s, s.bi_buf);
      s.bi_buf = 0;
      s.bi_valid = 0;
    } else if (s.bi_valid >= 8) {
      s.pending_buf[s.pending++] = s.bi_buf & 0xff;
      s.bi_buf >>= 8;
      s.bi_valid -= 8;
    }
  }
  /* ===========================================================================
   * Compute the optimal bit lengths for a tree and update the total bit length
   * for the current block.
   * IN assertion: the fields freq and dad are set, heap[heap_max] and
   *    above are the tree nodes sorted by increasing frequency.
   * OUT assertions: the field len is set to the optimal bit length, the
   *     array bl_count contains the frequencies for each bit length.
   *     The length opt_len is updated; static_len is also updated if stree is
   *     not null.
   */


  function gen_bitlen(s, desc) {
    //    deflate_state *s;
    //    tree_desc *desc;    /* the tree descriptor */
    var tree = desc.dyn_tree;
    var max_code = desc.max_code;
    var stree = desc.stat_desc.static_tree;
    var has_stree = desc.stat_desc.has_stree;
    var extra = desc.stat_desc.extra_bits;
    var base = desc.stat_desc.extra_base;
    var max_length = desc.stat_desc.max_length;
    var h;
    /* heap index */

    var n, m;
    /* iterate over the tree elements */

    var bits;
    /* bit length */

    var xbits;
    /* extra bits */

    var f;
    /* frequency */

    var overflow = 0;
    /* number of elements with bit length too large */

    for (bits = 0; bits <= MAX_BITS; bits++) {
      s.bl_count[bits] = 0;
    }
    /* In a first pass, compute the optimal bit lengths (which may
     * overflow in the case of the bit length tree).
     */


    tree[s.heap[s.heap_max] * 2 + 1]
    /*.Len*/
    = 0;
    /* root of the heap */

    for (h = s.heap_max + 1; h < HEAP_SIZE; h++) {
      n = s.heap[h];
      bits = tree[tree[n * 2 + 1]
      /*.Dad*/
      * 2 + 1]
      /*.Len*/
      + 1;

      if (bits > max_length) {
        bits = max_length;
        overflow++;
      }

      tree[n * 2 + 1]
      /*.Len*/
      = bits;
      /* We overwrite tree[n].Dad which is no longer needed */

      if (n > max_code) {
        continue;
      }
      /* not a leaf node */


      s.bl_count[bits]++;
      xbits = 0;

      if (n >= base) {
        xbits = extra[n - base];
      }

      f = tree[n * 2]
      /*.Freq*/
      ;
      s.opt_len += f * (bits + xbits);

      if (has_stree) {
        s.static_len += f * (stree[n * 2 + 1]
        /*.Len*/
        + xbits);
      }
    }

    if (overflow === 0) {
      return;
    } // Trace((stderr,"\nbit length overflow\n"));

    /* This happens for example on obj2 and pic of the Calgary corpus */

    /* Find the first bit length which could increase: */


    do {
      bits = max_length - 1;

      while (s.bl_count[bits] === 0) {
        bits--;
      }

      s.bl_count[bits]--;
      /* move one leaf down the tree */

      s.bl_count[bits + 1] += 2;
      /* move one overflow item as its brother */

      s.bl_count[max_length]--;
      /* The brother of the overflow item also moves one step up,
       * but this does not affect bl_count[max_length]
       */

      overflow -= 2;
    } while (overflow > 0);
    /* Now recompute all bit lengths, scanning in increasing frequency.
     * h is still equal to HEAP_SIZE. (It is simpler to reconstruct all
     * lengths instead of fixing only the wrong ones. This idea is taken
     * from 'ar' written by Haruhiko Okumura.)
     */


    for (bits = max_length; bits !== 0; bits--) {
      n = s.bl_count[bits];

      while (n !== 0) {
        m = s.heap[--h];

        if (m > max_code) {
          continue;
        }

        if (tree[m * 2 + 1]
        /*.Len*/
        !== bits) {
          // Trace((stderr,"code %d bits %d->%d\n", m, tree[m].Len, bits));
          s.opt_len += (bits - tree[m * 2 + 1]
          /*.Len*/
          ) * tree[m * 2]
          /*.Freq*/
          ;
          tree[m * 2 + 1]
          /*.Len*/
          = bits;
        }

        n--;
      }
    }
  }
  /* ===========================================================================
   * Generate the codes for a given tree and bit counts (which need not be
   * optimal).
   * IN assertion: the array bl_count contains the bit length statistics for
   * the given tree and the field len is set for all tree elements.
   * OUT assertion: the field code is set for all tree elements of non
   *     zero code length.
   */


  function gen_codes(tree, max_code, bl_count) {
    //    ct_data *tree;             /* the tree to decorate */
    //    int max_code;              /* largest code with non zero frequency */
    //    ushf *bl_count;            /* number of codes at each bit length */
    var next_code = new Array(MAX_BITS + 1);
    /* next code value for each bit length */

    var code = 0;
    /* running code value */

    var bits;
    /* bit index */

    var n;
    /* code index */

    /* The distribution counts are first used to generate the code values
     * without bit reversal.
     */

    for (bits = 1; bits <= MAX_BITS; bits++) {
      next_code[bits] = code = code + bl_count[bits - 1] << 1;
    }
    /* Check that the bit counts in bl_count are consistent. The last code
     * must be all ones.
     */
    //Assert (code + bl_count[MAX_BITS]-1 == (1<<MAX_BITS)-1,
    //        "inconsistent bit counts");
    //Tracev((stderr,"\ngen_codes: max_code %d ", max_code));


    for (n = 0; n <= max_code; n++) {
      var len = tree[n * 2 + 1]
      /*.Len*/
      ;

      if (len === 0) {
        continue;
      }
      /* Now reverse the bits */


      tree[n * 2]
      /*.Code*/
      = bi_reverse(next_code[len]++, len); //Tracecv(tree != static_ltree, (stderr,"\nn %3d %c l %2d c %4x (%x) ",
      //     n, (isgraph(n) ? n : ' '), len, tree[n].Code, next_code[len]-1));
    }
  }
  /* ===========================================================================
   * Initialize the various 'constant' tables.
   */


  function tr_static_init() {
    var n;
    /* iterates over tree elements */

    var bits;
    /* bit counter */

    var length;
    /* length value */

    var code;
    /* code value */

    var dist;
    /* distance index */

    var bl_count = new Array(MAX_BITS + 1);
    /* number of codes at each bit length for an optimal tree */
    // do check in _tr_init()
    //if (static_init_done) return;

    /* For some embedded targets, global variables are not initialized: */

    /*#ifdef NO_INIT_GLOBAL_POINTERS
      static_l_desc.static_tree = static_ltree;
      static_l_desc.extra_bits = extra_lbits;
      static_d_desc.static_tree = static_dtree;
      static_d_desc.extra_bits = extra_dbits;
      static_bl_desc.extra_bits = extra_blbits;
    #endif*/

    /* Initialize the mapping length (0..255) -> length code (0..28) */

    length = 0;

    for (code = 0; code < LENGTH_CODES - 1; code++) {
      base_length[code] = length;

      for (n = 0; n < 1 << extra_lbits[code]; n++) {
        _length_code[length++] = code;
      }
    } //Assert (length == 256, "tr_static_init: length != 256");

    /* Note that the length 255 (match length 258) can be represented
     * in two different ways: code 284 + 5 bits or code 285, so we
     * overwrite length_code[255] to use the best encoding:
     */


    _length_code[length - 1] = code;
    /* Initialize the mapping dist (0..32K) -> dist code (0..29) */

    dist = 0;

    for (code = 0; code < 16; code++) {
      base_dist[code] = dist;

      for (n = 0; n < 1 << extra_dbits[code]; n++) {
        _dist_code[dist++] = code;
      }
    } //Assert (dist == 256, "tr_static_init: dist != 256");


    dist >>= 7;
    /* from now on, all distances are divided by 128 */

    for (; code < D_CODES; code++) {
      base_dist[code] = dist << 7;

      for (n = 0; n < 1 << extra_dbits[code] - 7; n++) {
        _dist_code[256 + dist++] = code;
      }
    } //Assert (dist == 256, "tr_static_init: 256+dist != 512");

    /* Construct the codes of the static literal tree */


    for (bits = 0; bits <= MAX_BITS; bits++) {
      bl_count[bits] = 0;
    }

    n = 0;

    while (n <= 143) {
      static_ltree[n * 2 + 1]
      /*.Len*/
      = 8;
      n++;
      bl_count[8]++;
    }

    while (n <= 255) {
      static_ltree[n * 2 + 1]
      /*.Len*/
      = 9;
      n++;
      bl_count[9]++;
    }

    while (n <= 279) {
      static_ltree[n * 2 + 1]
      /*.Len*/
      = 7;
      n++;
      bl_count[7]++;
    }

    while (n <= 287) {
      static_ltree[n * 2 + 1]
      /*.Len*/
      = 8;
      n++;
      bl_count[8]++;
    }
    /* Codes 286 and 287 do not exist, but we must include them in the
     * tree construction to get a canonical Huffman tree (longest code
     * all ones)
     */


    gen_codes(static_ltree, L_CODES + 1, bl_count);
    /* The static distance tree is trivial: */

    for (n = 0; n < D_CODES; n++) {
      static_dtree[n * 2 + 1]
      /*.Len*/
      = 5;
      static_dtree[n * 2]
      /*.Code*/
      = bi_reverse(n, 5);
    } // Now data ready and we can init static trees


    static_l_desc = new StaticTreeDesc(static_ltree, extra_lbits, LITERALS + 1, L_CODES, MAX_BITS);
    static_d_desc = new StaticTreeDesc(static_dtree, extra_dbits, 0, D_CODES, MAX_BITS);
    static_bl_desc = new StaticTreeDesc(new Array(0), extra_blbits, 0, BL_CODES, MAX_BL_BITS); //static_init_done = true;
  }
  /* ===========================================================================
   * Initialize a new block.
   */


  function init_block(s) {
    var n;
    /* iterates over tree elements */

    /* Initialize the trees. */

    for (n = 0; n < L_CODES; n++) {
      s.dyn_ltree[n * 2]
      /*.Freq*/
      = 0;
    }

    for (n = 0; n < D_CODES; n++) {
      s.dyn_dtree[n * 2]
      /*.Freq*/
      = 0;
    }

    for (n = 0; n < BL_CODES; n++) {
      s.bl_tree[n * 2]
      /*.Freq*/
      = 0;
    }

    s.dyn_ltree[END_BLOCK * 2]
    /*.Freq*/
    = 1;
    s.opt_len = s.static_len = 0;
    s.last_lit = s.matches = 0;
  }
  /* ===========================================================================
   * Flush the bit buffer and align the output on a byte boundary
   */


  function bi_windup(s) {
    if (s.bi_valid > 8) {
      put_short(s, s.bi_buf);
    } else if (s.bi_valid > 0) {
      //put_byte(s, (Byte)s->bi_buf);
      s.pending_buf[s.pending++] = s.bi_buf;
    }

    s.bi_buf = 0;
    s.bi_valid = 0;
  }
  /* ===========================================================================
   * Copy a stored block, storing first the length and its
   * one's complement if requested.
   */


  function copy_block(s, buf, len, header) {
    //DeflateState *s;
    //charf    *buf;    /* the input data */
    //unsigned len;     /* its length */
    //int      header;  /* true if block header must be written */
    bi_windup(s);
    /* align on byte boundary */

    if (header) {
      put_short(s, len);
      put_short(s, ~len);
    } //  while (len--) {
    //    put_byte(s, *buf++);
    //  }


    arraySet(s.pending_buf, s.window, buf, len, s.pending);
    s.pending += len;
  }
  /* ===========================================================================
   * Compares to subtrees, using the tree depth as tie breaker when
   * the subtrees have equal frequency. This minimizes the worst case length.
   */


  function smaller(tree, n, m, depth) {
    var _n2 = n * 2;

    var _m2 = m * 2;

    return tree[_n2]
    /*.Freq*/
    < tree[_m2]
    /*.Freq*/
    || tree[_n2]
    /*.Freq*/
    === tree[_m2]
    /*.Freq*/
    && depth[n] <= depth[m];
  }
  /* ===========================================================================
   * Restore the heap property by moving down the tree starting at node k,
   * exchanging a node with the smallest of its two sons if necessary, stopping
   * when the heap property is re-established (each father smaller than its
   * two sons).
   */


  function pqdownheap(s, tree, k) //    deflate_state *s;
  //    ct_data *tree;  /* the tree to restore */
  //    int k;               /* node to move down */
  {
    var v = s.heap[k];
    var j = k << 1;
    /* left son of k */

    while (j <= s.heap_len) {
      /* Set j to the smallest of the two sons: */
      if (j < s.heap_len && smaller(tree, s.heap[j + 1], s.heap[j], s.depth)) {
        j++;
      }
      /* Exit if v is smaller than both sons */


      if (smaller(tree, v, s.heap[j], s.depth)) {
        break;
      }
      /* Exchange v with the smallest son */


      s.heap[k] = s.heap[j];
      k = j;
      /* And continue down the tree, setting j to the left son of k */

      j <<= 1;
    }

    s.heap[k] = v;
  } // inlined manually
  // var SMALLEST = 1;

  /* ===========================================================================
   * Send the block data compressed using the given Huffman trees
   */


  function compress_block(s, ltree, dtree) //    deflate_state *s;
  //    const ct_data *ltree; /* literal tree */
  //    const ct_data *dtree; /* distance tree */
  {
    var dist;
    /* distance of matched string */

    var lc;
    /* match length or unmatched char (if dist == 0) */

    var lx = 0;
    /* running index in l_buf */

    var code;
    /* the code to send */

    var extra;
    /* number of extra bits to send */

    if (s.last_lit !== 0) {
      do {
        dist = s.pending_buf[s.d_buf + lx * 2] << 8 | s.pending_buf[s.d_buf + lx * 2 + 1];
        lc = s.pending_buf[s.l_buf + lx];
        lx++;

        if (dist === 0) {
          send_code(s, lc, ltree);
          /* send a literal byte */
          //Tracecv(isgraph(lc), (stderr," '%c' ", lc));
        } else {
          /* Here, lc is the match length - MIN_MATCH */
          code = _length_code[lc];
          send_code(s, code + LITERALS + 1, ltree);
          /* send the length code */

          extra = extra_lbits[code];

          if (extra !== 0) {
            lc -= base_length[code];
            send_bits(s, lc, extra);
            /* send the extra length bits */
          }

          dist--;
          /* dist is now the match distance - 1 */

          code = d_code(dist); //Assert (code < D_CODES, "bad d_code");

          send_code(s, code, dtree);
          /* send the distance code */

          extra = extra_dbits[code];

          if (extra !== 0) {
            dist -= base_dist[code];
            send_bits(s, dist, extra);
            /* send the extra distance bits */
          }
        }
        /* literal or match pair ? */

        /* Check that the overlay between pending_buf and d_buf+l_buf is ok: */
        //Assert((uInt)(s->pending) < s->lit_bufsize + 2*lx,
        //       "pendingBuf overflow");

      } while (lx < s.last_lit);
    }

    send_code(s, END_BLOCK, ltree);
  }
  /* ===========================================================================
   * Construct one Huffman tree and assigns the code bit strings and lengths.
   * Update the total bit length for the current block.
   * IN assertion: the field freq is set for all tree elements.
   * OUT assertions: the fields len and code are set to the optimal bit length
   *     and corresponding code. The length opt_len is updated; static_len is
   *     also updated if stree is not null. The field max_code is set.
   */


  function build_tree(s, desc) //    deflate_state *s;
  //    tree_desc *desc; /* the tree descriptor */
  {
    var tree = desc.dyn_tree;
    var stree = desc.stat_desc.static_tree;
    var has_stree = desc.stat_desc.has_stree;
    var elems = desc.stat_desc.elems;
    var n, m;
    /* iterate over heap elements */

    var max_code = -1;
    /* largest code with non zero frequency */

    var node;
    /* new node being created */

    /* Construct the initial heap, with least frequent element in
     * heap[SMALLEST]. The sons of heap[n] are heap[2*n] and heap[2*n+1].
     * heap[0] is not used.
     */

    s.heap_len = 0;
    s.heap_max = HEAP_SIZE;

    for (n = 0; n < elems; n++) {
      if (tree[n * 2]
      /*.Freq*/
      !== 0) {
        s.heap[++s.heap_len] = max_code = n;
        s.depth[n] = 0;
      } else {
        tree[n * 2 + 1]
        /*.Len*/
        = 0;
      }
    }
    /* The pkzip format requires that at least one distance code exists,
     * and that at least one bit should be sent even if there is only one
     * possible code. So to avoid special checks later on we force at least
     * two codes of non zero frequency.
     */


    while (s.heap_len < 2) {
      node = s.heap[++s.heap_len] = max_code < 2 ? ++max_code : 0;
      tree[node * 2]
      /*.Freq*/
      = 1;
      s.depth[node] = 0;
      s.opt_len--;

      if (has_stree) {
        s.static_len -= stree[node * 2 + 1]
        /*.Len*/
        ;
      }
      /* node is 0 or 1 so it does not have extra bits */

    }

    desc.max_code = max_code;
    /* The elements heap[heap_len/2+1 .. heap_len] are leaves of the tree,
     * establish sub-heaps of increasing lengths:
     */

    for (n = s.heap_len >> 1
    /*int /2*/
    ; n >= 1; n--) {
      pqdownheap(s, tree, n);
    }
    /* Construct the Huffman tree by repeatedly combining the least two
     * frequent nodes.
     */


    node = elems;
    /* next internal node of the tree */

    do {
      //pqremove(s, tree, n);  /* n = node of least frequency */

      /*** pqremove ***/
      n = s.heap[1
      /*SMALLEST*/
      ];
      s.heap[1
      /*SMALLEST*/
      ] = s.heap[s.heap_len--];
      pqdownheap(s, tree, 1
      /*SMALLEST*/
      );
      /***/

      m = s.heap[1
      /*SMALLEST*/
      ];
      /* m = node of next least frequency */

      s.heap[--s.heap_max] = n;
      /* keep the nodes sorted by frequency */

      s.heap[--s.heap_max] = m;
      /* Create a new node father of n and m */

      tree[node * 2]
      /*.Freq*/
      = tree[n * 2]
      /*.Freq*/
      + tree[m * 2]
      /*.Freq*/
      ;
      s.depth[node] = (s.depth[n] >= s.depth[m] ? s.depth[n] : s.depth[m]) + 1;
      tree[n * 2 + 1]
      /*.Dad*/
      = tree[m * 2 + 1]
      /*.Dad*/
      = node;
      /* and insert the new node in the heap */

      s.heap[1
      /*SMALLEST*/
      ] = node++;
      pqdownheap(s, tree, 1
      /*SMALLEST*/
      );
    } while (s.heap_len >= 2);

    s.heap[--s.heap_max] = s.heap[1
    /*SMALLEST*/
    ];
    /* At this point, the fields freq and dad are set. We can now
     * generate the bit lengths.
     */

    gen_bitlen(s, desc);
    /* The field len is now set, we can generate the bit codes */

    gen_codes(tree, max_code, s.bl_count);
  }
  /* ===========================================================================
   * Scan a literal or distance tree to determine the frequencies of the codes
   * in the bit length tree.
   */


  function scan_tree(s, tree, max_code) //    deflate_state *s;
  //    ct_data *tree;   /* the tree to be scanned */
  //    int max_code;    /* and its largest code of non zero frequency */
  {
    var n;
    /* iterates over all tree elements */

    var prevlen = -1;
    /* last emitted length */

    var curlen;
    /* length of current code */

    var nextlen = tree[0 * 2 + 1]
    /*.Len*/
    ;
    /* length of next code */

    var count = 0;
    /* repeat count of the current code */

    var max_count = 7;
    /* max repeat count */

    var min_count = 4;
    /* min repeat count */

    if (nextlen === 0) {
      max_count = 138;
      min_count = 3;
    }

    tree[(max_code + 1) * 2 + 1]
    /*.Len*/
    = 0xffff;
    /* guard */

    for (n = 0; n <= max_code; n++) {
      curlen = nextlen;
      nextlen = tree[(n + 1) * 2 + 1]
      /*.Len*/
      ;

      if (++count < max_count && curlen === nextlen) {
        continue;
      } else if (count < min_count) {
        s.bl_tree[curlen * 2]
        /*.Freq*/
        += count;
      } else if (curlen !== 0) {
        if (curlen !== prevlen) {
          s.bl_tree[curlen * 2] /*.Freq*/++;
        }

        s.bl_tree[REP_3_6 * 2] /*.Freq*/++;
      } else if (count <= 10) {
        s.bl_tree[REPZ_3_10 * 2] /*.Freq*/++;
      } else {
        s.bl_tree[REPZ_11_138 * 2] /*.Freq*/++;
      }

      count = 0;
      prevlen = curlen;

      if (nextlen === 0) {
        max_count = 138;
        min_count = 3;
      } else if (curlen === nextlen) {
        max_count = 6;
        min_count = 3;
      } else {
        max_count = 7;
        min_count = 4;
      }
    }
  }
  /* ===========================================================================
   * Send a literal or distance tree in compressed form, using the codes in
   * bl_tree.
   */


  function send_tree(s, tree, max_code) //    deflate_state *s;
  //    ct_data *tree; /* the tree to be scanned */
  //    int max_code;       /* and its largest code of non zero frequency */
  {
    var n;
    /* iterates over all tree elements */

    var prevlen = -1;
    /* last emitted length */

    var curlen;
    /* length of current code */

    var nextlen = tree[0 * 2 + 1]
    /*.Len*/
    ;
    /* length of next code */

    var count = 0;
    /* repeat count of the current code */

    var max_count = 7;
    /* max repeat count */

    var min_count = 4;
    /* min repeat count */

    /* tree[max_code+1].Len = -1; */

    /* guard already set */

    if (nextlen === 0) {
      max_count = 138;
      min_count = 3;
    }

    for (n = 0; n <= max_code; n++) {
      curlen = nextlen;
      nextlen = tree[(n + 1) * 2 + 1]
      /*.Len*/
      ;

      if (++count < max_count && curlen === nextlen) {
        continue;
      } else if (count < min_count) {
        do {
          send_code(s, curlen, s.bl_tree);
        } while (--count !== 0);
      } else if (curlen !== 0) {
        if (curlen !== prevlen) {
          send_code(s, curlen, s.bl_tree);
          count--;
        } //Assert(count >= 3 && count <= 6, " 3_6?");


        send_code(s, REP_3_6, s.bl_tree);
        send_bits(s, count - 3, 2);
      } else if (count <= 10) {
        send_code(s, REPZ_3_10, s.bl_tree);
        send_bits(s, count - 3, 3);
      } else {
        send_code(s, REPZ_11_138, s.bl_tree);
        send_bits(s, count - 11, 7);
      }

      count = 0;
      prevlen = curlen;

      if (nextlen === 0) {
        max_count = 138;
        min_count = 3;
      } else if (curlen === nextlen) {
        max_count = 6;
        min_count = 3;
      } else {
        max_count = 7;
        min_count = 4;
      }
    }
  }
  /* ===========================================================================
   * Construct the Huffman tree for the bit lengths and return the index in
   * bl_order of the last bit length code to send.
   */


  function build_bl_tree(s) {
    var max_blindex;
    /* index of last bit length code of non zero freq */

    /* Determine the bit length frequencies for literal and distance trees */

    scan_tree(s, s.dyn_ltree, s.l_desc.max_code);
    scan_tree(s, s.dyn_dtree, s.d_desc.max_code);
    /* Build the bit length tree: */

    build_tree(s, s.bl_desc);
    /* opt_len now includes the length of the tree representations, except
     * the lengths of the bit lengths codes and the 5+5+4 bits for the counts.
     */

    /* Determine the number of bit length codes to send. The pkzip format
     * requires that at least 4 bit length codes be sent. (appnote.txt says
     * 3 but the actual value used is 4.)
     */

    for (max_blindex = BL_CODES - 1; max_blindex >= 3; max_blindex--) {
      if (s.bl_tree[bl_order[max_blindex] * 2 + 1]
      /*.Len*/
      !== 0) {
        break;
      }
    }
    /* Update opt_len to include the bit length tree and counts */


    s.opt_len += 3 * (max_blindex + 1) + 5 + 5 + 4; //Tracev((stderr, "\ndyn trees: dyn %ld, stat %ld",
    //        s->opt_len, s->static_len));

    return max_blindex;
  }
  /* ===========================================================================
   * Send the header for a block using dynamic Huffman trees: the counts, the
   * lengths of the bit length codes, the literal tree and the distance tree.
   * IN assertion: lcodes >= 257, dcodes >= 1, blcodes >= 4.
   */


  function send_all_trees(s, lcodes, dcodes, blcodes) //    deflate_state *s;
  //    int lcodes, dcodes, blcodes; /* number of codes for each tree */
  {
    var rank;
    /* index in bl_order */
    //Assert (lcodes >= 257 && dcodes >= 1 && blcodes >= 4, "not enough codes");
    //Assert (lcodes <= L_CODES && dcodes <= D_CODES && blcodes <= BL_CODES,
    //        "too many codes");
    //Tracev((stderr, "\nbl counts: "));

    send_bits(s, lcodes - 257, 5);
    /* not +255 as stated in appnote.txt */

    send_bits(s, dcodes - 1, 5);
    send_bits(s, blcodes - 4, 4);
    /* not -3 as stated in appnote.txt */

    for (rank = 0; rank < blcodes; rank++) {
      //Tracev((stderr, "\nbl code %2d ", bl_order[rank]));
      send_bits(s, s.bl_tree[bl_order[rank] * 2 + 1]
      /*.Len*/
      , 3);
    } //Tracev((stderr, "\nbl tree: sent %ld", s->bits_sent));


    send_tree(s, s.dyn_ltree, lcodes - 1);
    /* literal tree */
    //Tracev((stderr, "\nlit tree: sent %ld", s->bits_sent));

    send_tree(s, s.dyn_dtree, dcodes - 1);
    /* distance tree */
    //Tracev((stderr, "\ndist tree: sent %ld", s->bits_sent));
  }
  /* ===========================================================================
   * Check if the data type is TEXT or BINARY, using the following algorithm:
   * - TEXT if the two conditions below are satisfied:
   *    a) There are no non-portable control characters belonging to the
   *       "black list" (0..6, 14..25, 28..31).
   *    b) There is at least one printable character belonging to the
   *       "white list" (9 {TAB}, 10 {LF}, 13 {CR}, 32..255).
   * - BINARY otherwise.
   * - The following partially-portable control characters form a
   *   "gray list" that is ignored in this detection algorithm:
   *   (7 {BEL}, 8 {BS}, 11 {VT}, 12 {FF}, 26 {SUB}, 27 {ESC}).
   * IN assertion: the fields Freq of dyn_ltree are set.
   */


  function detect_data_type(s) {
    /* black_mask is the bit mask of black-listed bytes
     * set bits 0..6, 14..25, and 28..31
     * 0xf3ffc07f = binary 11110011111111111100000001111111
     */
    var black_mask = 0xf3ffc07f;
    var n;
    /* Check for non-textual ("black-listed") bytes. */

    for (n = 0; n <= 31; n++, black_mask >>>= 1) {
      if (black_mask & 1 && s.dyn_ltree[n * 2]
      /*.Freq*/
      !== 0) {
        return Z_BINARY;
      }
    }
    /* Check for textual ("white-listed") bytes. */


    if (s.dyn_ltree[9 * 2]
    /*.Freq*/
    !== 0 || s.dyn_ltree[10 * 2]
    /*.Freq*/
    !== 0 || s.dyn_ltree[13 * 2]
    /*.Freq*/
    !== 0) {
      return Z_TEXT;
    }

    for (n = 32; n < LITERALS; n++) {
      if (s.dyn_ltree[n * 2]
      /*.Freq*/
      !== 0) {
        return Z_TEXT;
      }
    }
    /* There are no "black-listed" or "white-listed" bytes:
     * this stream either is empty or has tolerated ("gray-listed") bytes only.
     */


    return Z_BINARY;
  }

  var static_init_done = false;
  /* ===========================================================================
   * Initialize the tree data structures for a new zlib stream.
   */

  function _tr_init(s) {
    if (!static_init_done) {
      tr_static_init();
      static_init_done = true;
    }

    s.l_desc = new TreeDesc(s.dyn_ltree, static_l_desc);
    s.d_desc = new TreeDesc(s.dyn_dtree, static_d_desc);
    s.bl_desc = new TreeDesc(s.bl_tree, static_bl_desc);
    s.bi_buf = 0;
    s.bi_valid = 0;
    /* Initialize the first block of the first file: */

    init_block(s);
  }
  /* ===========================================================================
   * Send a stored block
   */

  function _tr_stored_block(s, buf, stored_len, last) //DeflateState *s;
  //charf *buf;       /* input block */
  //ulg stored_len;   /* length of input block */
  //int last;         /* one if this is the last block for a file */
  {
    send_bits(s, (STORED_BLOCK << 1) + (last ? 1 : 0), 3);
    /* send block type */

    copy_block(s, buf, stored_len, true);
    /* with header */
  }
  /* ===========================================================================
   * Send one empty static block to give enough lookahead for inflate.
   * This takes 10 bits, of which 7 may remain in the bit buffer.
   */

  function _tr_align(s) {
    send_bits(s, STATIC_TREES << 1, 3);
    send_code(s, END_BLOCK, static_ltree);
    bi_flush(s);
  }
  /* ===========================================================================
   * Determine the best encoding for the current block: dynamic trees, static
   * trees or store, and output the encoded block to the zip file.
   */

  function _tr_flush_block(s, buf, stored_len, last) //DeflateState *s;
  //charf *buf;       /* input block, or NULL if too old */
  //ulg stored_len;   /* length of input block */
  //int last;         /* one if this is the last block for a file */
  {
    var opt_lenb, static_lenb;
    /* opt_len and static_len in bytes */

    var max_blindex = 0;
    /* index of last bit length code of non zero freq */

    /* Build the Huffman trees unless a stored block is forced */

    if (s.level > 0) {
      /* Check if the file is binary or text */
      if (s.strm.data_type === Z_UNKNOWN) {
        s.strm.data_type = detect_data_type(s);
      }
      /* Construct the literal and distance trees */


      build_tree(s, s.l_desc); // Tracev((stderr, "\nlit data: dyn %ld, stat %ld", s->opt_len,
      //        s->static_len));

      build_tree(s, s.d_desc); // Tracev((stderr, "\ndist data: dyn %ld, stat %ld", s->opt_len,
      //        s->static_len));

      /* At this point, opt_len and static_len are the total bit lengths of
       * the compressed block data, excluding the tree representations.
       */

      /* Build the bit length tree for the above two trees, and get the index
       * in bl_order of the last bit length code to send.
       */

      max_blindex = build_bl_tree(s);
      /* Determine the best encoding. Compute the block lengths in bytes. */

      opt_lenb = s.opt_len + 3 + 7 >>> 3;
      static_lenb = s.static_len + 3 + 7 >>> 3; // Tracev((stderr, "\nopt %lu(%lu) stat %lu(%lu) stored %lu lit %u ",
      //        opt_lenb, s->opt_len, static_lenb, s->static_len, stored_len,
      //        s->last_lit));

      if (static_lenb <= opt_lenb) {
        opt_lenb = static_lenb;
      }
    } else {
      // Assert(buf != (char*)0, "lost buf");
      opt_lenb = static_lenb = stored_len + 5;
      /* force a stored block */
    }

    if (stored_len + 4 <= opt_lenb && buf !== -1) {
      /* 4: two words for the lengths */

      /* The test buf != NULL is only necessary if LIT_BUFSIZE > WSIZE.
       * Otherwise we can't have processed more than WSIZE input bytes since
       * the last block flush, because compression would have been
       * successful. If LIT_BUFSIZE <= WSIZE, it is never too late to
       * transform a block into a stored block.
       */
      _tr_stored_block(s, buf, stored_len, last);
    } else if (s.strategy === Z_FIXED || static_lenb === opt_lenb) {
      send_bits(s, (STATIC_TREES << 1) + (last ? 1 : 0), 3);
      compress_block(s, static_ltree, static_dtree);
    } else {
      send_bits(s, (DYN_TREES << 1) + (last ? 1 : 0), 3);
      send_all_trees(s, s.l_desc.max_code + 1, s.d_desc.max_code + 1, max_blindex + 1);
      compress_block(s, s.dyn_ltree, s.dyn_dtree);
    } // Assert (s->compressed_len == s->bits_sent, "bad compressed size");

    /* The above check is made mod 2^32, for files larger than 512 MB
     * and uLong implemented on 32 bits.
     */


    init_block(s);

    if (last) {
      bi_windup(s);
    } // Tracev((stderr,"\ncomprlen %lu(%lu) ", s->compressed_len>>3,
    //       s->compressed_len-7*last));

  }
  /* ===========================================================================
   * Save the match info and tally the frequency counts. Return true if
   * the current block must be flushed.
   */

  function _tr_tally(s, dist, lc) //    deflate_state *s;
  //    unsigned dist;  /* distance of matched string */
  //    unsigned lc;    /* match length-MIN_MATCH or unmatched char (if dist==0) */
  {
    //var out_length, in_length, dcode;
    s.pending_buf[s.d_buf + s.last_lit * 2] = dist >>> 8 & 0xff;
    s.pending_buf[s.d_buf + s.last_lit * 2 + 1] = dist & 0xff;
    s.pending_buf[s.l_buf + s.last_lit] = lc & 0xff;
    s.last_lit++;

    if (dist === 0) {
      /* lc is the unmatched char */
      s.dyn_ltree[lc * 2] /*.Freq*/++;
    } else {
      s.matches++;
      /* Here, lc is the match length - MIN_MATCH */

      dist--;
      /* dist = match distance - 1 */
      //Assert((ush)dist < (ush)MAX_DIST(s) &&
      //       (ush)lc <= (ush)(MAX_MATCH-MIN_MATCH) &&
      //       (ush)d_code(dist) < (ush)D_CODES,  "_tr_tally: bad match");

      s.dyn_ltree[(_length_code[lc] + LITERALS + 1) * 2] /*.Freq*/++;
      s.dyn_dtree[d_code(dist) * 2] /*.Freq*/++;
    } // (!) This block is disabled in zlib defailts,
    // don't enable it for binary compatibility
    //#ifdef TRUNCATE_BLOCK
    //  /* Try to guess if it is profitable to stop the current block here */
    //  if ((s.last_lit & 0x1fff) === 0 && s.level > 2) {
    //    /* Compute an upper bound for the compressed length */
    //    out_length = s.last_lit*8;
    //    in_length = s.strstart - s.block_start;
    //
    //    for (dcode = 0; dcode < D_CODES; dcode++) {
    //      out_length += s.dyn_dtree[dcode*2]/*.Freq*/ * (5 + extra_dbits[dcode]);
    //    }
    //    out_length >>>= 3;
    //    //Tracev((stderr,"\nlast_lit %u, in %ld, out ~%ld(%ld%%) ",
    //    //       s->last_lit, in_length, out_length,
    //    //       100L - out_length*100L/in_length));
    //    if (s.matches < (s.last_lit>>1)/*int /2*/ && out_length < (in_length>>1)/*int /2*/) {
    //      return true;
    //    }
    //  }
    //#endif


    return s.last_lit === s.lit_bufsize - 1;
    /* We avoid equality with lit_bufsize because of wraparound at 64K
     * on 16 bit machines and because stored blocks are restricted to
     * 64K-1 bytes.
     */
  }

  // Note: adler32 takes 12% for level 0 and 2% for level 6.
  // It doesn't worth to make additional optimizationa as in original.
  // Small size is preferable.
  function adler32(adler, buf, len, pos) {
    var s1 = adler & 0xffff | 0,
        s2 = adler >>> 16 & 0xffff | 0,
        n = 0;

    while (len !== 0) {
      // Set limit ~ twice less than 5552, to keep
      // s2 in 31-bits, because we force signed ints.
      // in other case %= will fail.
      n = len > 2000 ? 2000 : len;
      len -= n;

      do {
        s1 = s1 + buf[pos++] | 0;
        s2 = s2 + s1 | 0;
      } while (--n);

      s1 %= 65521;
      s2 %= 65521;
    }

    return s1 | s2 << 16 | 0;
  }

  // Note: we can't get significant speed boost here.
  // So write code to minimize size - no pregenerated tables
  // and array tools dependencies.
  // Use ordinary array, since untyped makes no boost here
  function makeTable() {
    var c,
        table = [];

    for (var n = 0; n < 256; n++) {
      c = n;

      for (var k = 0; k < 8; k++) {
        c = c & 1 ? 0xEDB88320 ^ c >>> 1 : c >>> 1;
      }

      table[n] = c;
    }

    return table;
  } // Create table on load. Just 255 signed longs. Not a problem.


  var crcTable = makeTable();

  function crc32(crc, buf, len, pos) {
    var t = crcTable,
        end = pos + len;
    crc ^= -1;

    for (var i = pos; i < end; i++) {
      crc = crc >>> 8 ^ t[(crc ^ buf[i]) & 0xFF];
    }

    return crc ^ -1; // >>> 0;
  }

  /* Public constants ==========================================================*/

  /* ===========================================================================*/

  /* Allowed flush values; see deflate() and inflate() below for details */

  var Z_NO_FLUSH = 0;
  var Z_PARTIAL_FLUSH = 1; //var Z_SYNC_FLUSH    = 2;

  var Z_FULL_FLUSH = 3;
  var Z_FINISH = 4;
  var Z_BLOCK = 5; //var Z_TREES         = 6;

  /* Return codes for the compression/decompression functions. Negative values
   * are errors, positive values are used for special but normal events.
   */

  var Z_OK = 0;
  var Z_STREAM_END = 1; //var Z_NEED_DICT     = 2;
  //var Z_ERRNO         = -1;

  var Z_STREAM_ERROR = -2;
  var Z_DATA_ERROR = -3; //var Z_MEM_ERROR     = -4;

  var Z_BUF_ERROR = -5; //var Z_VERSION_ERROR = -6;

  /* compression levels */
  //var Z_NO_COMPRESSION      = 0;
  //var Z_BEST_SPEED          = 1;
  //var Z_BEST_COMPRESSION    = 9;

  var Z_DEFAULT_COMPRESSION = -1;
  var Z_FILTERED = 1;
  var Z_HUFFMAN_ONLY = 2;
  var Z_RLE = 3;
  var Z_FIXED$1 = 4;
  /* Possible values of the data_type field (though see inflate()) */
  //var Z_BINARY              = 0;
  //var Z_TEXT                = 1;
  //var Z_ASCII               = 1; // = Z_TEXT

  var Z_UNKNOWN$1 = 2;
  /* The deflate compression method */

  var Z_DEFLATED = 8;
  /*============================================================================*/

  var MAX_MEM_LEVEL = 9;
  var LENGTH_CODES$1 = 29;
  /* number of length codes, not counting the special END_BLOCK code */

  var LITERALS$1 = 256;
  /* number of literal bytes 0..255 */

  var L_CODES$1 = LITERALS$1 + 1 + LENGTH_CODES$1;
  /* number of Literal or Length codes, including the END_BLOCK code */

  var D_CODES$1 = 30;
  /* number of distance codes */

  var BL_CODES$1 = 19;
  /* number of codes used to transfer the bit lengths */

  var HEAP_SIZE$1 = 2 * L_CODES$1 + 1;
  /* maximum heap size */

  var MAX_BITS$1 = 15;
  /* All codes must not exceed MAX_BITS bits */

  var MIN_MATCH$1 = 3;
  var MAX_MATCH$1 = 258;
  var MIN_LOOKAHEAD = MAX_MATCH$1 + MIN_MATCH$1 + 1;
  var PRESET_DICT = 0x20;
  var INIT_STATE = 42;
  var EXTRA_STATE = 69;
  var NAME_STATE = 73;
  var COMMENT_STATE = 91;
  var HCRC_STATE = 103;
  var BUSY_STATE = 113;
  var FINISH_STATE = 666;
  var BS_NEED_MORE = 1;
  /* block not completed, need more input or more output */

  var BS_BLOCK_DONE = 2;
  /* block flush performed */

  var BS_FINISH_STARTED = 3;
  /* finish started, need only more output at next deflate */

  var BS_FINISH_DONE = 4;
  /* finish done, accept no more input or output */

  var OS_CODE = 0x03; // Unix :) . Don't detect, use this default.

  function err(strm, errorCode) {
    strm.msg = msg[errorCode];
    return errorCode;
  }

  function rank(f) {
    return (f << 1) - (f > 4 ? 9 : 0);
  }

  function zero$1(buf) {
    var len = buf.length;

    while (--len >= 0) {
      buf[len] = 0;
    }
  }
  /* =========================================================================
   * Flush as much pending output as possible. All deflate() output goes
   * through this function so some applications may wish to modify it
   * to avoid allocating a large strm->output buffer and copying into it.
   * (See also read_buf()).
   */


  function flush_pending(strm) {
    var s = strm.state; //_tr_flush_bits(s);

    var len = s.pending;

    if (len > strm.avail_out) {
      len = strm.avail_out;
    }

    if (len === 0) {
      return;
    }

    arraySet(strm.output, s.pending_buf, s.pending_out, len, strm.next_out);
    strm.next_out += len;
    s.pending_out += len;
    strm.total_out += len;
    strm.avail_out -= len;
    s.pending -= len;

    if (s.pending === 0) {
      s.pending_out = 0;
    }
  }

  function flush_block_only(s, last) {
    _tr_flush_block(s, s.block_start >= 0 ? s.block_start : -1, s.strstart - s.block_start, last);

    s.block_start = s.strstart;
    flush_pending(s.strm);
  }

  function put_byte(s, b) {
    s.pending_buf[s.pending++] = b;
  }
  /* =========================================================================
   * Put a short in the pending buffer. The 16-bit value is put in MSB order.
   * IN assertion: the stream state is correct and there is enough room in
   * pending_buf.
   */


  function putShortMSB(s, b) {
    //  put_byte(s, (Byte)(b >> 8));
    //  put_byte(s, (Byte)(b & 0xff));
    s.pending_buf[s.pending++] = b >>> 8 & 0xff;
    s.pending_buf[s.pending++] = b & 0xff;
  }
  /* ===========================================================================
   * Read a new buffer from the current input stream, update the adler32
   * and total number of bytes read.  All deflate() input goes through
   * this function so some applications may wish to modify it to avoid
   * allocating a large strm->input buffer and copying from it.
   * (See also flush_pending()).
   */


  function read_buf(strm, buf, start, size) {
    var len = strm.avail_in;

    if (len > size) {
      len = size;
    }

    if (len === 0) {
      return 0;
    }

    strm.avail_in -= len; // zmemcpy(buf, strm->next_in, len);

    arraySet(buf, strm.input, strm.next_in, len, start);

    if (strm.state.wrap === 1) {
      strm.adler = adler32(strm.adler, buf, len, start);
    } else if (strm.state.wrap === 2) {
      strm.adler = crc32(strm.adler, buf, len, start);
    }

    strm.next_in += len;
    strm.total_in += len;
    return len;
  }
  /* ===========================================================================
   * Set match_start to the longest match starting at the given string and
   * return its length. Matches shorter or equal to prev_length are discarded,
   * in which case the result is equal to prev_length and match_start is
   * garbage.
   * IN assertions: cur_match is the head of the hash chain for the current
   *   string (strstart) and its distance is <= MAX_DIST, and prev_length >= 1
   * OUT assertion: the match length is not greater than s->lookahead.
   */


  function longest_match(s, cur_match) {
    var chain_length = s.max_chain_length;
    /* max hash chain length */

    var scan = s.strstart;
    /* current string */

    var match;
    /* matched string */

    var len;
    /* length of current match */

    var best_len = s.prev_length;
    /* best match length so far */

    var nice_match = s.nice_match;
    /* stop if match long enough */

    var limit = s.strstart > s.w_size - MIN_LOOKAHEAD ? s.strstart - (s.w_size - MIN_LOOKAHEAD) : 0
    /*NIL*/
    ;
    var _win = s.window; // shortcut

    var wmask = s.w_mask;
    var prev = s.prev;
    /* Stop when cur_match becomes <= limit. To simplify the code,
     * we prevent matches with the string of window index 0.
     */

    var strend = s.strstart + MAX_MATCH$1;
    var scan_end1 = _win[scan + best_len - 1];
    var scan_end = _win[scan + best_len];
    /* The code is optimized for HASH_BITS >= 8 and MAX_MATCH-2 multiple of 16.
     * It is easy to get rid of this optimization if necessary.
     */
    // Assert(s->hash_bits >= 8 && MAX_MATCH == 258, "Code too clever");

    /* Do not waste too much time if we already have a good match: */

    if (s.prev_length >= s.good_match) {
      chain_length >>= 2;
    }
    /* Do not look for matches beyond the end of the input. This is necessary
     * to make deflate deterministic.
     */


    if (nice_match > s.lookahead) {
      nice_match = s.lookahead;
    } // Assert((ulg)s->strstart <= s->window_size-MIN_LOOKAHEAD, "need lookahead");


    do {
      // Assert(cur_match < s->strstart, "no future");
      match = cur_match;
      /* Skip to next match if the match length cannot increase
       * or if the match length is less than 2.  Note that the checks below
       * for insufficient lookahead only occur occasionally for performance
       * reasons.  Therefore uninitialized memory will be accessed, and
       * conditional jumps will be made that depend on those values.
       * However the length of the match is limited to the lookahead, so
       * the output of deflate is not affected by the uninitialized values.
       */

      if (_win[match + best_len] !== scan_end || _win[match + best_len - 1] !== scan_end1 || _win[match] !== _win[scan] || _win[++match] !== _win[scan + 1]) {
        continue;
      }
      /* The check at best_len-1 can be removed because it will be made
       * again later. (This heuristic is not always a win.)
       * It is not necessary to compare scan[2] and match[2] since they
       * are always equal when the other bytes match, given that
       * the hash keys are equal and that HASH_BITS >= 8.
       */


      scan += 2;
      match++; // Assert(*scan == *match, "match[2]?");

      /* We check for insufficient lookahead only every 8th comparison;
       * the 256th check will be made at strstart+258.
       */

      do {
        /*jshint noempty:false*/
      } while (_win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && scan < strend); // Assert(scan <= s->window+(unsigned)(s->window_size-1), "wild scan");


      len = MAX_MATCH$1 - (strend - scan);
      scan = strend - MAX_MATCH$1;

      if (len > best_len) {
        s.match_start = cur_match;
        best_len = len;

        if (len >= nice_match) {
          break;
        }

        scan_end1 = _win[scan + best_len - 1];
        scan_end = _win[scan + best_len];
      }
    } while ((cur_match = prev[cur_match & wmask]) > limit && --chain_length !== 0);

    if (best_len <= s.lookahead) {
      return best_len;
    }

    return s.lookahead;
  }
  /* ===========================================================================
   * Fill the window when the lookahead becomes insufficient.
   * Updates strstart and lookahead.
   *
   * IN assertion: lookahead < MIN_LOOKAHEAD
   * OUT assertions: strstart <= window_size-MIN_LOOKAHEAD
   *    At least one byte has been read, or avail_in == 0; reads are
   *    performed for at least two bytes (required for the zip translate_eol
   *    option -- not supported here).
   */


  function fill_window(s) {
    var _w_size = s.w_size;
    var p, n, m, more, str; //Assert(s->lookahead < MIN_LOOKAHEAD, "already enough lookahead");

    do {
      more = s.window_size - s.lookahead - s.strstart; // JS ints have 32 bit, block below not needed

      /* Deal with !@#$% 64K limit: */
      //if (sizeof(int) <= 2) {
      //    if (more == 0 && s->strstart == 0 && s->lookahead == 0) {
      //        more = wsize;
      //
      //  } else if (more == (unsigned)(-1)) {
      //        /* Very unlikely, but possible on 16 bit machine if
      //         * strstart == 0 && lookahead == 1 (input done a byte at time)
      //         */
      //        more--;
      //    }
      //}

      /* If the window is almost full and there is insufficient lookahead,
       * move the upper half to the lower one to make room in the upper half.
       */

      if (s.strstart >= _w_size + (_w_size - MIN_LOOKAHEAD)) {
        arraySet(s.window, s.window, _w_size, _w_size, 0);
        s.match_start -= _w_size;
        s.strstart -= _w_size;
        /* we now have strstart >= MAX_DIST */

        s.block_start -= _w_size;
        /* Slide the hash table (could be avoided with 32 bit values
         at the expense of memory usage). We slide even when level == 0
         to keep the hash table consistent if we switch back to level > 0
         later. (Using level 0 permanently is not an optimal usage of
         zlib, so we don't care about this pathological case.)
         */

        n = s.hash_size;
        p = n;

        do {
          m = s.head[--p];
          s.head[p] = m >= _w_size ? m - _w_size : 0;
        } while (--n);

        n = _w_size;
        p = n;

        do {
          m = s.prev[--p];
          s.prev[p] = m >= _w_size ? m - _w_size : 0;
          /* If n is not on any hash chain, prev[n] is garbage but
           * its value will never be used.
           */
        } while (--n);

        more += _w_size;
      }

      if (s.strm.avail_in === 0) {
        break;
      }
      /* If there was no sliding:
       *    strstart <= WSIZE+MAX_DIST-1 && lookahead <= MIN_LOOKAHEAD - 1 &&
       *    more == window_size - lookahead - strstart
       * => more >= window_size - (MIN_LOOKAHEAD-1 + WSIZE + MAX_DIST-1)
       * => more >= window_size - 2*WSIZE + 2
       * In the BIG_MEM or MMAP case (not yet supported),
       *   window_size == input_size + MIN_LOOKAHEAD  &&
       *   strstart + s->lookahead <= input_size => more >= MIN_LOOKAHEAD.
       * Otherwise, window_size == 2*WSIZE so more >= 2.
       * If there was sliding, more >= WSIZE. So in all cases, more >= 2.
       */
      //Assert(more >= 2, "more < 2");


      n = read_buf(s.strm, s.window, s.strstart + s.lookahead, more);
      s.lookahead += n;
      /* Initialize the hash value now that we have some input: */

      if (s.lookahead + s.insert >= MIN_MATCH$1) {
        str = s.strstart - s.insert;
        s.ins_h = s.window[str];
        /* UPDATE_HASH(s, s->ins_h, s->window[str + 1]); */

        s.ins_h = (s.ins_h << s.hash_shift ^ s.window[str + 1]) & s.hash_mask; //#if MIN_MATCH != 3
        //        Call update_hash() MIN_MATCH-3 more times
        //#endif

        while (s.insert) {
          /* UPDATE_HASH(s, s->ins_h, s->window[str + MIN_MATCH-1]); */
          s.ins_h = (s.ins_h << s.hash_shift ^ s.window[str + MIN_MATCH$1 - 1]) & s.hash_mask;
          s.prev[str & s.w_mask] = s.head[s.ins_h];
          s.head[s.ins_h] = str;
          str++;
          s.insert--;

          if (s.lookahead + s.insert < MIN_MATCH$1) {
            break;
          }
        }
      }
      /* If the whole input has less than MIN_MATCH bytes, ins_h is garbage,
       * but this is not important since only literal bytes will be emitted.
       */

    } while (s.lookahead < MIN_LOOKAHEAD && s.strm.avail_in !== 0);
    /* If the WIN_INIT bytes after the end of the current data have never been
     * written, then zero those bytes in order to avoid memory check reports of
     * the use of uninitialized (or uninitialised as Julian writes) bytes by
     * the longest match routines.  Update the high water mark for the next
     * time through here.  WIN_INIT is set to MAX_MATCH since the longest match
     * routines allow scanning to strstart + MAX_MATCH, ignoring lookahead.
     */
    //  if (s.high_water < s.window_size) {
    //    var curr = s.strstart + s.lookahead;
    //    var init = 0;
    //
    //    if (s.high_water < curr) {
    //      /* Previous high water mark below current data -- zero WIN_INIT
    //       * bytes or up to end of window, whichever is less.
    //       */
    //      init = s.window_size - curr;
    //      if (init > WIN_INIT)
    //        init = WIN_INIT;
    //      zmemzero(s->window + curr, (unsigned)init);
    //      s->high_water = curr + init;
    //    }
    //    else if (s->high_water < (ulg)curr + WIN_INIT) {
    //      /* High water mark at or above current data, but below current data
    //       * plus WIN_INIT -- zero out to current data plus WIN_INIT, or up
    //       * to end of window, whichever is less.
    //       */
    //      init = (ulg)curr + WIN_INIT - s->high_water;
    //      if (init > s->window_size - s->high_water)
    //        init = s->window_size - s->high_water;
    //      zmemzero(s->window + s->high_water, (unsigned)init);
    //      s->high_water += init;
    //    }
    //  }
    //
    //  Assert((ulg)s->strstart <= s->window_size - MIN_LOOKAHEAD,
    //    "not enough room for search");

  }
  /* ===========================================================================
   * Copy without compression as much as possible from the input stream, return
   * the current block state.
   * This function does not insert new strings in the dictionary since
   * uncompressible data is probably not useful. This function is used
   * only for the level=0 compression option.
   * NOTE: this function should be optimized to avoid extra copying from
   * window to pending_buf.
   */


  function deflate_stored(s, flush) {
    /* Stored blocks are limited to 0xffff bytes, pending_buf is limited
     * to pending_buf_size, and each stored block has a 5 byte header:
     */
    var max_block_size = 0xffff;

    if (max_block_size > s.pending_buf_size - 5) {
      max_block_size = s.pending_buf_size - 5;
    }
    /* Copy as much as possible from input to output: */


    for (;;) {
      /* Fill the window as much as possible: */
      if (s.lookahead <= 1) {
        //Assert(s->strstart < s->w_size+MAX_DIST(s) ||
        //  s->block_start >= (long)s->w_size, "slide too late");
        //      if (!(s.strstart < s.w_size + (s.w_size - MIN_LOOKAHEAD) ||
        //        s.block_start >= s.w_size)) {
        //        throw  new Error("slide too late");
        //      }
        fill_window(s);

        if (s.lookahead === 0 && flush === Z_NO_FLUSH) {
          return BS_NEED_MORE;
        }

        if (s.lookahead === 0) {
          break;
        }
        /* flush the current block */

      } //Assert(s->block_start >= 0L, "block gone");
      //    if (s.block_start < 0) throw new Error("block gone");


      s.strstart += s.lookahead;
      s.lookahead = 0;
      /* Emit a stored block if pending_buf will be full: */

      var max_start = s.block_start + max_block_size;

      if (s.strstart === 0 || s.strstart >= max_start) {
        /* strstart == 0 is possible when wraparound on 16-bit machine */
        s.lookahead = s.strstart - max_start;
        s.strstart = max_start;
        /*** FLUSH_BLOCK(s, 0); ***/

        flush_block_only(s, false);

        if (s.strm.avail_out === 0) {
          return BS_NEED_MORE;
        }
        /***/

      }
      /* Flush if we may have to slide, otherwise block_start may become
       * negative and the data will be gone:
       */


      if (s.strstart - s.block_start >= s.w_size - MIN_LOOKAHEAD) {
        /*** FLUSH_BLOCK(s, 0); ***/
        flush_block_only(s, false);

        if (s.strm.avail_out === 0) {
          return BS_NEED_MORE;
        }
        /***/

      }
    }

    s.insert = 0;

    if (flush === Z_FINISH) {
      /*** FLUSH_BLOCK(s, 1); ***/
      flush_block_only(s, true);

      if (s.strm.avail_out === 0) {
        return BS_FINISH_STARTED;
      }
      /***/


      return BS_FINISH_DONE;
    }

    if (s.strstart > s.block_start) {
      /*** FLUSH_BLOCK(s, 0); ***/
      flush_block_only(s, false);

      if (s.strm.avail_out === 0) {
        return BS_NEED_MORE;
      }
      /***/

    }

    return BS_NEED_MORE;
  }
  /* ===========================================================================
   * Compress as much as possible from the input stream, return the current
   * block state.
   * This function does not perform lazy evaluation of matches and inserts
   * new strings in the dictionary only for unmatched strings or for short
   * matches. It is used only for the fast compression options.
   */


  function deflate_fast(s, flush) {
    var hash_head;
    /* head of the hash chain */

    var bflush;
    /* set if current block must be flushed */

    for (;;) {
      /* Make sure that we always have enough lookahead, except
       * at the end of the input file. We need MAX_MATCH bytes
       * for the next match, plus MIN_MATCH bytes to insert the
       * string following the next match.
       */
      if (s.lookahead < MIN_LOOKAHEAD) {
        fill_window(s);

        if (s.lookahead < MIN_LOOKAHEAD && flush === Z_NO_FLUSH) {
          return BS_NEED_MORE;
        }

        if (s.lookahead === 0) {
          break;
          /* flush the current block */
        }
      }
      /* Insert the string window[strstart .. strstart+2] in the
       * dictionary, and set hash_head to the head of the hash chain:
       */


      hash_head = 0
      /*NIL*/
      ;

      if (s.lookahead >= MIN_MATCH$1) {
        /*** INSERT_STRING(s, s.strstart, hash_head); ***/
        s.ins_h = (s.ins_h << s.hash_shift ^ s.window[s.strstart + MIN_MATCH$1 - 1]) & s.hash_mask;
        hash_head = s.prev[s.strstart & s.w_mask] = s.head[s.ins_h];
        s.head[s.ins_h] = s.strstart;
        /***/
      }
      /* Find the longest match, discarding those <= prev_length.
       * At this point we have always match_length < MIN_MATCH
       */


      if (hash_head !== 0
      /*NIL*/
      && s.strstart - hash_head <= s.w_size - MIN_LOOKAHEAD) {
        /* To simplify the code, we prevent matches with the string
         * of window index 0 (in particular we have to avoid a match
         * of the string with itself at the start of the input file).
         */
        s.match_length = longest_match(s, hash_head);
        /* longest_match() sets match_start */
      }

      if (s.match_length >= MIN_MATCH$1) {
        // check_match(s, s.strstart, s.match_start, s.match_length); // for debug only

        /*** _tr_tally_dist(s, s.strstart - s.match_start,
                       s.match_length - MIN_MATCH, bflush); ***/
        bflush = _tr_tally(s, s.strstart - s.match_start, s.match_length - MIN_MATCH$1);
        s.lookahead -= s.match_length;
        /* Insert new strings in the hash table only if the match length
         * is not too large. This saves time but degrades compression.
         */

        if (s.match_length <= s.max_lazy_match
        /*max_insert_length*/
        && s.lookahead >= MIN_MATCH$1) {
          s.match_length--;
          /* string at strstart already in table */

          do {
            s.strstart++;
            /*** INSERT_STRING(s, s.strstart, hash_head); ***/

            s.ins_h = (s.ins_h << s.hash_shift ^ s.window[s.strstart + MIN_MATCH$1 - 1]) & s.hash_mask;
            hash_head = s.prev[s.strstart & s.w_mask] = s.head[s.ins_h];
            s.head[s.ins_h] = s.strstart;
            /***/

            /* strstart never exceeds WSIZE-MAX_MATCH, so there are
             * always MIN_MATCH bytes ahead.
             */
          } while (--s.match_length !== 0);

          s.strstart++;
        } else {
          s.strstart += s.match_length;
          s.match_length = 0;
          s.ins_h = s.window[s.strstart];
          /* UPDATE_HASH(s, s.ins_h, s.window[s.strstart+1]); */

          s.ins_h = (s.ins_h << s.hash_shift ^ s.window[s.strstart + 1]) & s.hash_mask; //#if MIN_MATCH != 3
          //                Call UPDATE_HASH() MIN_MATCH-3 more times
          //#endif

          /* If lookahead < MIN_MATCH, ins_h is garbage, but it does not
           * matter since it will be recomputed at next deflate call.
           */
        }
      } else {
        /* No match, output a literal byte */
        //Tracevv((stderr,"%c", s.window[s.strstart]));

        /*** _tr_tally_lit(s, s.window[s.strstart], bflush); ***/
        bflush = _tr_tally(s, 0, s.window[s.strstart]);
        s.lookahead--;
        s.strstart++;
      }

      if (bflush) {
        /*** FLUSH_BLOCK(s, 0); ***/
        flush_block_only(s, false);

        if (s.strm.avail_out === 0) {
          return BS_NEED_MORE;
        }
        /***/

      }
    }

    s.insert = s.strstart < MIN_MATCH$1 - 1 ? s.strstart : MIN_MATCH$1 - 1;

    if (flush === Z_FINISH) {
      /*** FLUSH_BLOCK(s, 1); ***/
      flush_block_only(s, true);

      if (s.strm.avail_out === 0) {
        return BS_FINISH_STARTED;
      }
      /***/


      return BS_FINISH_DONE;
    }

    if (s.last_lit) {
      /*** FLUSH_BLOCK(s, 0); ***/
      flush_block_only(s, false);

      if (s.strm.avail_out === 0) {
        return BS_NEED_MORE;
      }
      /***/

    }

    return BS_BLOCK_DONE;
  }
  /* ===========================================================================
   * Same as above, but achieves better compression. We use a lazy
   * evaluation for matches: a match is finally adopted only if there is
   * no better match at the next window position.
   */


  function deflate_slow(s, flush) {
    var hash_head;
    /* head of hash chain */

    var bflush;
    /* set if current block must be flushed */

    var max_insert;
    /* Process the input block. */

    for (;;) {
      /* Make sure that we always have enough lookahead, except
       * at the end of the input file. We need MAX_MATCH bytes
       * for the next match, plus MIN_MATCH bytes to insert the
       * string following the next match.
       */
      if (s.lookahead < MIN_LOOKAHEAD) {
        fill_window(s);

        if (s.lookahead < MIN_LOOKAHEAD && flush === Z_NO_FLUSH) {
          return BS_NEED_MORE;
        }

        if (s.lookahead === 0) {
          break;
        }
        /* flush the current block */

      }
      /* Insert the string window[strstart .. strstart+2] in the
       * dictionary, and set hash_head to the head of the hash chain:
       */


      hash_head = 0
      /*NIL*/
      ;

      if (s.lookahead >= MIN_MATCH$1) {
        /*** INSERT_STRING(s, s.strstart, hash_head); ***/
        s.ins_h = (s.ins_h << s.hash_shift ^ s.window[s.strstart + MIN_MATCH$1 - 1]) & s.hash_mask;
        hash_head = s.prev[s.strstart & s.w_mask] = s.head[s.ins_h];
        s.head[s.ins_h] = s.strstart;
        /***/
      }
      /* Find the longest match, discarding those <= prev_length.
       */


      s.prev_length = s.match_length;
      s.prev_match = s.match_start;
      s.match_length = MIN_MATCH$1 - 1;

      if (hash_head !== 0
      /*NIL*/
      && s.prev_length < s.max_lazy_match && s.strstart - hash_head <= s.w_size - MIN_LOOKAHEAD
      /*MAX_DIST(s)*/
      ) {
          /* To simplify the code, we prevent matches with the string
           * of window index 0 (in particular we have to avoid a match
           * of the string with itself at the start of the input file).
           */
          s.match_length = longest_match(s, hash_head);
          /* longest_match() sets match_start */

          if (s.match_length <= 5 && (s.strategy === Z_FILTERED || s.match_length === MIN_MATCH$1 && s.strstart - s.match_start > 4096
          /*TOO_FAR*/
          )) {
            /* If prev_match is also MIN_MATCH, match_start is garbage
             * but we will ignore the current match anyway.
             */
            s.match_length = MIN_MATCH$1 - 1;
          }
        }
      /* If there was a match at the previous step and the current
       * match is not better, output the previous match:
       */


      if (s.prev_length >= MIN_MATCH$1 && s.match_length <= s.prev_length) {
        max_insert = s.strstart + s.lookahead - MIN_MATCH$1;
        /* Do not insert strings in hash table beyond this. */
        //check_match(s, s.strstart-1, s.prev_match, s.prev_length);

        /***_tr_tally_dist(s, s.strstart - 1 - s.prev_match,
                       s.prev_length - MIN_MATCH, bflush);***/

        bflush = _tr_tally(s, s.strstart - 1 - s.prev_match, s.prev_length - MIN_MATCH$1);
        /* Insert in hash table all strings up to the end of the match.
         * strstart-1 and strstart are already inserted. If there is not
         * enough lookahead, the last two strings are not inserted in
         * the hash table.
         */

        s.lookahead -= s.prev_length - 1;
        s.prev_length -= 2;

        do {
          if (++s.strstart <= max_insert) {
            /*** INSERT_STRING(s, s.strstart, hash_head); ***/
            s.ins_h = (s.ins_h << s.hash_shift ^ s.window[s.strstart + MIN_MATCH$1 - 1]) & s.hash_mask;
            hash_head = s.prev[s.strstart & s.w_mask] = s.head[s.ins_h];
            s.head[s.ins_h] = s.strstart;
            /***/
          }
        } while (--s.prev_length !== 0);

        s.match_available = 0;
        s.match_length = MIN_MATCH$1 - 1;
        s.strstart++;

        if (bflush) {
          /*** FLUSH_BLOCK(s, 0); ***/
          flush_block_only(s, false);

          if (s.strm.avail_out === 0) {
            return BS_NEED_MORE;
          }
          /***/

        }
      } else if (s.match_available) {
        /* If there was no match at the previous position, output a
         * single literal. If there was a match but the current match
         * is longer, truncate the previous match to a single literal.
         */
        //Tracevv((stderr,"%c", s->window[s->strstart-1]));

        /*** _tr_tally_lit(s, s.window[s.strstart-1], bflush); ***/
        bflush = _tr_tally(s, 0, s.window[s.strstart - 1]);

        if (bflush) {
          /*** FLUSH_BLOCK_ONLY(s, 0) ***/
          flush_block_only(s, false);
          /***/
        }

        s.strstart++;
        s.lookahead--;

        if (s.strm.avail_out === 0) {
          return BS_NEED_MORE;
        }
      } else {
        /* There is no previous match to compare with, wait for
         * the next step to decide.
         */
        s.match_available = 1;
        s.strstart++;
        s.lookahead--;
      }
    } //Assert (flush != Z_NO_FLUSH, "no flush?");


    if (s.match_available) {
      //Tracevv((stderr,"%c", s->window[s->strstart-1]));

      /*** _tr_tally_lit(s, s.window[s.strstart-1], bflush); ***/
      bflush = _tr_tally(s, 0, s.window[s.strstart - 1]);
      s.match_available = 0;
    }

    s.insert = s.strstart < MIN_MATCH$1 - 1 ? s.strstart : MIN_MATCH$1 - 1;

    if (flush === Z_FINISH) {
      /*** FLUSH_BLOCK(s, 1); ***/
      flush_block_only(s, true);

      if (s.strm.avail_out === 0) {
        return BS_FINISH_STARTED;
      }
      /***/


      return BS_FINISH_DONE;
    }

    if (s.last_lit) {
      /*** FLUSH_BLOCK(s, 0); ***/
      flush_block_only(s, false);

      if (s.strm.avail_out === 0) {
        return BS_NEED_MORE;
      }
      /***/

    }

    return BS_BLOCK_DONE;
  }
  /* ===========================================================================
   * For Z_RLE, simply look for runs of bytes, generate matches only of distance
   * one.  Do not maintain a hash table.  (It will be regenerated if this run of
   * deflate switches away from Z_RLE.)
   */


  function deflate_rle(s, flush) {
    var bflush;
    /* set if current block must be flushed */

    var prev;
    /* byte at distance one to match */

    var scan, strend;
    /* scan goes up to strend for length of run */

    var _win = s.window;

    for (;;) {
      /* Make sure that we always have enough lookahead, except
       * at the end of the input file. We need MAX_MATCH bytes
       * for the longest run, plus one for the unrolled loop.
       */
      if (s.lookahead <= MAX_MATCH$1) {
        fill_window(s);

        if (s.lookahead <= MAX_MATCH$1 && flush === Z_NO_FLUSH) {
          return BS_NEED_MORE;
        }

        if (s.lookahead === 0) {
          break;
        }
        /* flush the current block */

      }
      /* See how many times the previous byte repeats */


      s.match_length = 0;

      if (s.lookahead >= MIN_MATCH$1 && s.strstart > 0) {
        scan = s.strstart - 1;
        prev = _win[scan];

        if (prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan]) {
          strend = s.strstart + MAX_MATCH$1;

          do {
            /*jshint noempty:false*/
          } while (prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan] && scan < strend);

          s.match_length = MAX_MATCH$1 - (strend - scan);

          if (s.match_length > s.lookahead) {
            s.match_length = s.lookahead;
          }
        } //Assert(scan <= s->window+(uInt)(s->window_size-1), "wild scan");

      }
      /* Emit match if have run of MIN_MATCH or longer, else emit literal */


      if (s.match_length >= MIN_MATCH$1) {
        //check_match(s, s.strstart, s.strstart - 1, s.match_length);

        /*** _tr_tally_dist(s, 1, s.match_length - MIN_MATCH, bflush); ***/
        bflush = _tr_tally(s, 1, s.match_length - MIN_MATCH$1);
        s.lookahead -= s.match_length;
        s.strstart += s.match_length;
        s.match_length = 0;
      } else {
        /* No match, output a literal byte */
        //Tracevv((stderr,"%c", s->window[s->strstart]));

        /*** _tr_tally_lit(s, s.window[s.strstart], bflush); ***/
        bflush = _tr_tally(s, 0, s.window[s.strstart]);
        s.lookahead--;
        s.strstart++;
      }

      if (bflush) {
        /*** FLUSH_BLOCK(s, 0); ***/
        flush_block_only(s, false);

        if (s.strm.avail_out === 0) {
          return BS_NEED_MORE;
        }
        /***/

      }
    }

    s.insert = 0;

    if (flush === Z_FINISH) {
      /*** FLUSH_BLOCK(s, 1); ***/
      flush_block_only(s, true);

      if (s.strm.avail_out === 0) {
        return BS_FINISH_STARTED;
      }
      /***/


      return BS_FINISH_DONE;
    }

    if (s.last_lit) {
      /*** FLUSH_BLOCK(s, 0); ***/
      flush_block_only(s, false);

      if (s.strm.avail_out === 0) {
        return BS_NEED_MORE;
      }
      /***/

    }

    return BS_BLOCK_DONE;
  }
  /* ===========================================================================
   * For Z_HUFFMAN_ONLY, do not look for matches.  Do not maintain a hash table.
   * (It will be regenerated if this run of deflate switches away from Huffman.)
   */


  function deflate_huff(s, flush) {
    var bflush;
    /* set if current block must be flushed */

    for (;;) {
      /* Make sure that we have a literal to write. */
      if (s.lookahead === 0) {
        fill_window(s);

        if (s.lookahead === 0) {
          if (flush === Z_NO_FLUSH) {
            return BS_NEED_MORE;
          }

          break;
          /* flush the current block */
        }
      }
      /* Output a literal byte */


      s.match_length = 0; //Tracevv((stderr,"%c", s->window[s->strstart]));

      /*** _tr_tally_lit(s, s.window[s.strstart], bflush); ***/

      bflush = _tr_tally(s, 0, s.window[s.strstart]);
      s.lookahead--;
      s.strstart++;

      if (bflush) {
        /*** FLUSH_BLOCK(s, 0); ***/
        flush_block_only(s, false);

        if (s.strm.avail_out === 0) {
          return BS_NEED_MORE;
        }
        /***/

      }
    }

    s.insert = 0;

    if (flush === Z_FINISH) {
      /*** FLUSH_BLOCK(s, 1); ***/
      flush_block_only(s, true);

      if (s.strm.avail_out === 0) {
        return BS_FINISH_STARTED;
      }
      /***/


      return BS_FINISH_DONE;
    }

    if (s.last_lit) {
      /*** FLUSH_BLOCK(s, 0); ***/
      flush_block_only(s, false);

      if (s.strm.avail_out === 0) {
        return BS_NEED_MORE;
      }
      /***/

    }

    return BS_BLOCK_DONE;
  }
  /* Values for max_lazy_match, good_match and max_chain_length, depending on
   * the desired pack level (0..9). The values given below have been tuned to
   * exclude worst case performance for pathological files. Better values may be
   * found for specific files.
   */


  function Config(good_length, max_lazy, nice_length, max_chain, func) {
    this.good_length = good_length;
    this.max_lazy = max_lazy;
    this.nice_length = nice_length;
    this.max_chain = max_chain;
    this.func = func;
  }

  var configuration_table;
  configuration_table = [
  /*      good lazy nice chain */
  new Config(0, 0, 0, 0, deflate_stored),
  /* 0 store only */
  new Config(4, 4, 8, 4, deflate_fast),
  /* 1 max speed, no lazy matches */
  new Config(4, 5, 16, 8, deflate_fast),
  /* 2 */
  new Config(4, 6, 32, 32, deflate_fast),
  /* 3 */
  new Config(4, 4, 16, 16, deflate_slow),
  /* 4 lazy matches */
  new Config(8, 16, 32, 32, deflate_slow),
  /* 5 */
  new Config(8, 16, 128, 128, deflate_slow),
  /* 6 */
  new Config(8, 32, 128, 256, deflate_slow),
  /* 7 */
  new Config(32, 128, 258, 1024, deflate_slow),
  /* 8 */
  new Config(32, 258, 258, 4096, deflate_slow)
  /* 9 max compression */
  ];
  /* ===========================================================================
   * Initialize the "longest match" routines for a new zlib stream
   */

  function lm_init(s) {
    s.window_size = 2 * s.w_size;
    /*** CLEAR_HASH(s); ***/

    zero$1(s.head); // Fill with NIL (= 0);

    /* Set the default configuration parameters:
     */

    s.max_lazy_match = configuration_table[s.level].max_lazy;
    s.good_match = configuration_table[s.level].good_length;
    s.nice_match = configuration_table[s.level].nice_length;
    s.max_chain_length = configuration_table[s.level].max_chain;
    s.strstart = 0;
    s.block_start = 0;
    s.lookahead = 0;
    s.insert = 0;
    s.match_length = s.prev_length = MIN_MATCH$1 - 1;
    s.match_available = 0;
    s.ins_h = 0;
  }

  function DeflateState() {
    this.strm = null;
    /* pointer back to this zlib stream */

    this.status = 0;
    /* as the name implies */

    this.pending_buf = null;
    /* output still pending */

    this.pending_buf_size = 0;
    /* size of pending_buf */

    this.pending_out = 0;
    /* next pending byte to output to the stream */

    this.pending = 0;
    /* nb of bytes in the pending buffer */

    this.wrap = 0;
    /* bit 0 true for zlib, bit 1 true for gzip */

    this.gzhead = null;
    /* gzip header information to write */

    this.gzindex = 0;
    /* where in extra, name, or comment */

    this.method = Z_DEFLATED;
    /* can only be DEFLATED */

    this.last_flush = -1;
    /* value of flush param for previous deflate call */

    this.w_size = 0;
    /* LZ77 window size (32K by default) */

    this.w_bits = 0;
    /* log2(w_size)  (8..16) */

    this.w_mask = 0;
    /* w_size - 1 */

    this.window = null;
    /* Sliding window. Input bytes are read into the second half of the window,
     * and move to the first half later to keep a dictionary of at least wSize
     * bytes. With this organization, matches are limited to a distance of
     * wSize-MAX_MATCH bytes, but this ensures that IO is always
     * performed with a length multiple of the block size.
     */

    this.window_size = 0;
    /* Actual size of window: 2*wSize, except when the user input buffer
     * is directly used as sliding window.
     */

    this.prev = null;
    /* Link to older string with same hash index. To limit the size of this
     * array to 64K, this link is maintained only for the last 32K strings.
     * An index in this array is thus a window index modulo 32K.
     */

    this.head = null;
    /* Heads of the hash chains or NIL. */

    this.ins_h = 0;
    /* hash index of string to be inserted */

    this.hash_size = 0;
    /* number of elements in hash table */

    this.hash_bits = 0;
    /* log2(hash_size) */

    this.hash_mask = 0;
    /* hash_size-1 */

    this.hash_shift = 0;
    /* Number of bits by which ins_h must be shifted at each input
     * step. It must be such that after MIN_MATCH steps, the oldest
     * byte no longer takes part in the hash key, that is:
     *   hash_shift * MIN_MATCH >= hash_bits
     */

    this.block_start = 0;
    /* Window position at the beginning of the current output block. Gets
     * negative when the window is moved backwards.
     */

    this.match_length = 0;
    /* length of best match */

    this.prev_match = 0;
    /* previous match */

    this.match_available = 0;
    /* set if previous match exists */

    this.strstart = 0;
    /* start of string to insert */

    this.match_start = 0;
    /* start of matching string */

    this.lookahead = 0;
    /* number of valid bytes ahead in window */

    this.prev_length = 0;
    /* Length of the best match at previous step. Matches not greater than this
     * are discarded. This is used in the lazy match evaluation.
     */

    this.max_chain_length = 0;
    /* To speed up deflation, hash chains are never searched beyond this
     * length.  A higher limit improves compression ratio but degrades the
     * speed.
     */

    this.max_lazy_match = 0;
    /* Attempt to find a better match only when the current match is strictly
     * smaller than this value. This mechanism is used only for compression
     * levels >= 4.
     */
    // That's alias to max_lazy_match, don't use directly
    //this.max_insert_length = 0;

    /* Insert new strings in the hash table only if the match length is not
     * greater than this length. This saves time but degrades compression.
     * max_insert_length is used only for compression levels <= 3.
     */

    this.level = 0;
    /* compression level (1..9) */

    this.strategy = 0;
    /* favor or force Huffman coding*/

    this.good_match = 0;
    /* Use a faster search when the previous match is longer than this */

    this.nice_match = 0;
    /* Stop searching when current match exceeds this */

    /* used by c: */

    /* Didn't use ct_data typedef below to suppress compiler warning */
    // struct ct_data_s dyn_ltree[HEAP_SIZE];   /* literal and length tree */
    // struct ct_data_s dyn_dtree[2*D_CODES+1]; /* distance tree */
    // struct ct_data_s bl_tree[2*BL_CODES+1];  /* Huffman tree for bit lengths */
    // Use flat array of DOUBLE size, with interleaved fata,
    // because JS does not support effective

    this.dyn_ltree = new Buf16(HEAP_SIZE$1 * 2);
    this.dyn_dtree = new Buf16((2 * D_CODES$1 + 1) * 2);
    this.bl_tree = new Buf16((2 * BL_CODES$1 + 1) * 2);
    zero$1(this.dyn_ltree);
    zero$1(this.dyn_dtree);
    zero$1(this.bl_tree);
    this.l_desc = null;
    /* desc. for literal tree */

    this.d_desc = null;
    /* desc. for distance tree */

    this.bl_desc = null;
    /* desc. for bit length tree */
    //ush bl_count[MAX_BITS+1];

    this.bl_count = new Buf16(MAX_BITS$1 + 1);
    /* number of codes at each bit length for an optimal tree */
    //int heap[2*L_CODES+1];      /* heap used to build the Huffman trees */

    this.heap = new Buf16(2 * L_CODES$1 + 1);
    /* heap used to build the Huffman trees */

    zero$1(this.heap);
    this.heap_len = 0;
    /* number of elements in the heap */

    this.heap_max = 0;
    /* element of largest frequency */

    /* The sons of heap[n] are heap[2*n] and heap[2*n+1]. heap[0] is not used.
     * The same heap array is used to build all
     */

    this.depth = new Buf16(2 * L_CODES$1 + 1); //uch depth[2*L_CODES+1];

    zero$1(this.depth);
    /* Depth of each subtree used as tie breaker for trees of equal frequency
     */

    this.l_buf = 0;
    /* buffer index for literals or lengths */

    this.lit_bufsize = 0;
    /* Size of match buffer for literals/lengths.  There are 4 reasons for
     * limiting lit_bufsize to 64K:
     *   - frequencies can be kept in 16 bit counters
     *   - if compression is not successful for the first block, all input
     *     data is still in the window so we can still emit a stored block even
     *     when input comes from standard input.  (This can also be done for
     *     all blocks if lit_bufsize is not greater than 32K.)
     *   - if compression is not successful for a file smaller than 64K, we can
     *     even emit a stored file instead of a stored block (saving 5 bytes).
     *     This is applicable only for zip (not gzip or zlib).
     *   - creating new Huffman trees less frequently may not provide fast
     *     adaptation to changes in the input data statistics. (Take for
     *     example a binary file with poorly compressible code followed by
     *     a highly compressible string table.) Smaller buffer sizes give
     *     fast adaptation but have of course the overhead of transmitting
     *     trees more frequently.
     *   - I can't count above 4
     */

    this.last_lit = 0;
    /* running index in l_buf */

    this.d_buf = 0;
    /* Buffer index for distances. To simplify the code, d_buf and l_buf have
     * the same number of elements. To use different lengths, an extra flag
     * array would be necessary.
     */

    this.opt_len = 0;
    /* bit length of current block with optimal trees */

    this.static_len = 0;
    /* bit length of current block with static trees */

    this.matches = 0;
    /* number of string matches in current block */

    this.insert = 0;
    /* bytes at end of window left to insert */

    this.bi_buf = 0;
    /* Output buffer. bits are inserted starting at the bottom (least
     * significant bits).
     */

    this.bi_valid = 0;
    /* Number of valid bits in bi_buf.  All bits above the last valid bit
     * are always zero.
     */
    // Used for window memory init. We safely ignore it for JS. That makes
    // sense only for pointers and memory check tools.
    //this.high_water = 0;

    /* High water mark offset in window for initialized bytes -- bytes above
     * this are set to zero in order to avoid memory check warnings when
     * longest match routines access bytes past the input.  This is then
     * updated to the new high water mark.
     */
  }

  function deflateResetKeep(strm) {
    var s;

    if (!strm || !strm.state) {
      return err(strm, Z_STREAM_ERROR);
    }

    strm.total_in = strm.total_out = 0;
    strm.data_type = Z_UNKNOWN$1;
    s = strm.state;
    s.pending = 0;
    s.pending_out = 0;

    if (s.wrap < 0) {
      s.wrap = -s.wrap;
      /* was made negative by deflate(..., Z_FINISH); */
    }

    s.status = s.wrap ? INIT_STATE : BUSY_STATE;
    strm.adler = s.wrap === 2 ? 0 // crc32(0, Z_NULL, 0)
    : 1; // adler32(0, Z_NULL, 0)

    s.last_flush = Z_NO_FLUSH;

    _tr_init(s);

    return Z_OK;
  }
  function deflateReset(strm) {
    var ret = deflateResetKeep(strm);

    if (ret === Z_OK) {
      lm_init(strm.state);
    }

    return ret;
  }
  function deflateInit2(strm, level, method, windowBits, memLevel, strategy) {
    if (!strm) {
      // === Z_NULL
      return Z_STREAM_ERROR;
    }

    var wrap = 1;

    if (level === Z_DEFAULT_COMPRESSION) {
      level = 6;
    }

    if (windowBits < 0) {
      /* suppress zlib wrapper */
      wrap = 0;
      windowBits = -windowBits;
    } else if (windowBits > 15) {
      wrap = 2;
      /* write gzip wrapper instead */

      windowBits -= 16;
    }

    if (memLevel < 1 || memLevel > MAX_MEM_LEVEL || method !== Z_DEFLATED || windowBits < 8 || windowBits > 15 || level < 0 || level > 9 || strategy < 0 || strategy > Z_FIXED$1) {
      return err(strm, Z_STREAM_ERROR);
    }

    if (windowBits === 8) {
      windowBits = 9;
    }
    /* until 256-byte window bug fixed */


    var s = new DeflateState();
    strm.state = s;
    s.strm = strm;
    s.wrap = wrap;
    s.gzhead = null;
    s.w_bits = windowBits;
    s.w_size = 1 << s.w_bits;
    s.w_mask = s.w_size - 1;
    s.hash_bits = memLevel + 7;
    s.hash_size = 1 << s.hash_bits;
    s.hash_mask = s.hash_size - 1;
    s.hash_shift = ~~((s.hash_bits + MIN_MATCH$1 - 1) / MIN_MATCH$1);
    s.window = new Buf8(s.w_size * 2);
    s.head = new Buf16(s.hash_size);
    s.prev = new Buf16(s.w_size); // Don't need mem init magic for JS.
    //s.high_water = 0;  /* nothing written to s->window yet */

    s.lit_bufsize = 1 << memLevel + 6;
    /* 16K elements by default */

    s.pending_buf_size = s.lit_bufsize * 4; //overlay = (ushf *) ZALLOC(strm, s->lit_bufsize, sizeof(ush)+2);
    //s->pending_buf = (uchf *) overlay;

    s.pending_buf = new Buf8(s.pending_buf_size); // It is offset from `s.pending_buf` (size is `s.lit_bufsize * 2`)
    //s->d_buf = overlay + s->lit_bufsize/sizeof(ush);

    s.d_buf = 1 * s.lit_bufsize; //s->l_buf = s->pending_buf + (1+sizeof(ush))*s->lit_bufsize;

    s.l_buf = (1 + 2) * s.lit_bufsize;
    s.level = level;
    s.strategy = strategy;
    s.method = method;
    return deflateReset(strm);
  }
  function deflate(strm, flush) {
    var old_flush, s;
    var beg, val; // for gzip header write only

    if (!strm || !strm.state || flush > Z_BLOCK || flush < 0) {
      return strm ? err(strm, Z_STREAM_ERROR) : Z_STREAM_ERROR;
    }

    s = strm.state;

    if (!strm.output || !strm.input && strm.avail_in !== 0 || s.status === FINISH_STATE && flush !== Z_FINISH) {
      return err(strm, strm.avail_out === 0 ? Z_BUF_ERROR : Z_STREAM_ERROR);
    }

    s.strm = strm;
    /* just in case */

    old_flush = s.last_flush;
    s.last_flush = flush;
    /* Write the header */

    if (s.status === INIT_STATE) {
      if (s.wrap === 2) {
        // GZIP header
        strm.adler = 0; //crc32(0L, Z_NULL, 0);

        put_byte(s, 31);
        put_byte(s, 139);
        put_byte(s, 8);

        if (!s.gzhead) {
          // s->gzhead == Z_NULL
          put_byte(s, 0);
          put_byte(s, 0);
          put_byte(s, 0);
          put_byte(s, 0);
          put_byte(s, 0);
          put_byte(s, s.level === 9 ? 2 : s.strategy >= Z_HUFFMAN_ONLY || s.level < 2 ? 4 : 0);
          put_byte(s, OS_CODE);
          s.status = BUSY_STATE;
        } else {
          put_byte(s, (s.gzhead.text ? 1 : 0) + (s.gzhead.hcrc ? 2 : 0) + (!s.gzhead.extra ? 0 : 4) + (!s.gzhead.name ? 0 : 8) + (!s.gzhead.comment ? 0 : 16));
          put_byte(s, s.gzhead.time & 0xff);
          put_byte(s, s.gzhead.time >> 8 & 0xff);
          put_byte(s, s.gzhead.time >> 16 & 0xff);
          put_byte(s, s.gzhead.time >> 24 & 0xff);
          put_byte(s, s.level === 9 ? 2 : s.strategy >= Z_HUFFMAN_ONLY || s.level < 2 ? 4 : 0);
          put_byte(s, s.gzhead.os & 0xff);

          if (s.gzhead.extra && s.gzhead.extra.length) {
            put_byte(s, s.gzhead.extra.length & 0xff);
            put_byte(s, s.gzhead.extra.length >> 8 & 0xff);
          }

          if (s.gzhead.hcrc) {
            strm.adler = crc32(strm.adler, s.pending_buf, s.pending, 0);
          }

          s.gzindex = 0;
          s.status = EXTRA_STATE;
        }
      } else // DEFLATE header
        {
          var header = Z_DEFLATED + (s.w_bits - 8 << 4) << 8;
          var level_flags = -1;

          if (s.strategy >= Z_HUFFMAN_ONLY || s.level < 2) {
            level_flags = 0;
          } else if (s.level < 6) {
            level_flags = 1;
          } else if (s.level === 6) {
            level_flags = 2;
          } else {
            level_flags = 3;
          }

          header |= level_flags << 6;

          if (s.strstart !== 0) {
            header |= PRESET_DICT;
          }

          header += 31 - header % 31;
          s.status = BUSY_STATE;
          putShortMSB(s, header);
          /* Save the adler32 of the preset dictionary: */

          if (s.strstart !== 0) {
            putShortMSB(s, strm.adler >>> 16);
            putShortMSB(s, strm.adler & 0xffff);
          }

          strm.adler = 1; // adler32(0L, Z_NULL, 0);
        }
    } //#ifdef GZIP


    if (s.status === EXTRA_STATE) {
      if (s.gzhead.extra
      /* != Z_NULL*/
      ) {
          beg = s.pending;
          /* start of bytes to update crc */

          while (s.gzindex < (s.gzhead.extra.length & 0xffff)) {
            if (s.pending === s.pending_buf_size) {
              if (s.gzhead.hcrc && s.pending > beg) {
                strm.adler = crc32(strm.adler, s.pending_buf, s.pending - beg, beg);
              }

              flush_pending(strm);
              beg = s.pending;

              if (s.pending === s.pending_buf_size) {
                break;
              }
            }

            put_byte(s, s.gzhead.extra[s.gzindex] & 0xff);
            s.gzindex++;
          }

          if (s.gzhead.hcrc && s.pending > beg) {
            strm.adler = crc32(strm.adler, s.pending_buf, s.pending - beg, beg);
          }

          if (s.gzindex === s.gzhead.extra.length) {
            s.gzindex = 0;
            s.status = NAME_STATE;
          }
        } else {
        s.status = NAME_STATE;
      }
    }

    if (s.status === NAME_STATE) {
      if (s.gzhead.name
      /* != Z_NULL*/
      ) {
          beg = s.pending;
          /* start of bytes to update crc */
          //int val;

          do {
            if (s.pending === s.pending_buf_size) {
              if (s.gzhead.hcrc && s.pending > beg) {
                strm.adler = crc32(strm.adler, s.pending_buf, s.pending - beg, beg);
              }

              flush_pending(strm);
              beg = s.pending;

              if (s.pending === s.pending_buf_size) {
                val = 1;
                break;
              }
            } // JS specific: little magic to add zero terminator to end of string


            if (s.gzindex < s.gzhead.name.length) {
              val = s.gzhead.name.charCodeAt(s.gzindex++) & 0xff;
            } else {
              val = 0;
            }

            put_byte(s, val);
          } while (val !== 0);

          if (s.gzhead.hcrc && s.pending > beg) {
            strm.adler = crc32(strm.adler, s.pending_buf, s.pending - beg, beg);
          }

          if (val === 0) {
            s.gzindex = 0;
            s.status = COMMENT_STATE;
          }
        } else {
        s.status = COMMENT_STATE;
      }
    }

    if (s.status === COMMENT_STATE) {
      if (s.gzhead.comment
      /* != Z_NULL*/
      ) {
          beg = s.pending;
          /* start of bytes to update crc */
          //int val;

          do {
            if (s.pending === s.pending_buf_size) {
              if (s.gzhead.hcrc && s.pending > beg) {
                strm.adler = crc32(strm.adler, s.pending_buf, s.pending - beg, beg);
              }

              flush_pending(strm);
              beg = s.pending;

              if (s.pending === s.pending_buf_size) {
                val = 1;
                break;
              }
            } // JS specific: little magic to add zero terminator to end of string


            if (s.gzindex < s.gzhead.comment.length) {
              val = s.gzhead.comment.charCodeAt(s.gzindex++) & 0xff;
            } else {
              val = 0;
            }

            put_byte(s, val);
          } while (val !== 0);

          if (s.gzhead.hcrc && s.pending > beg) {
            strm.adler = crc32(strm.adler, s.pending_buf, s.pending - beg, beg);
          }

          if (val === 0) {
            s.status = HCRC_STATE;
          }
        } else {
        s.status = HCRC_STATE;
      }
    }

    if (s.status === HCRC_STATE) {
      if (s.gzhead.hcrc) {
        if (s.pending + 2 > s.pending_buf_size) {
          flush_pending(strm);
        }

        if (s.pending + 2 <= s.pending_buf_size) {
          put_byte(s, strm.adler & 0xff);
          put_byte(s, strm.adler >> 8 & 0xff);
          strm.adler = 0; //crc32(0L, Z_NULL, 0);

          s.status = BUSY_STATE;
        }
      } else {
        s.status = BUSY_STATE;
      }
    } //#endif

    /* Flush as much pending output as possible */


    if (s.pending !== 0) {
      flush_pending(strm);

      if (strm.avail_out === 0) {
        /* Since avail_out is 0, deflate will be called again with
         * more output space, but possibly with both pending and
         * avail_in equal to zero. There won't be anything to do,
         * but this is not an error situation so make sure we
         * return OK instead of BUF_ERROR at next call of deflate:
         */
        s.last_flush = -1;
        return Z_OK;
      }
      /* Make sure there is something to do and avoid duplicate consecutive
       * flushes. For repeated and useless calls with Z_FINISH, we keep
       * returning Z_STREAM_END instead of Z_BUF_ERROR.
       */

    } else if (strm.avail_in === 0 && rank(flush) <= rank(old_flush) && flush !== Z_FINISH) {
      return err(strm, Z_BUF_ERROR);
    }
    /* User must not provide more input after the first FINISH: */


    if (s.status === FINISH_STATE && strm.avail_in !== 0) {
      return err(strm, Z_BUF_ERROR);
    }
    /* Start a new block or continue the current one.
     */


    if (strm.avail_in !== 0 || s.lookahead !== 0 || flush !== Z_NO_FLUSH && s.status !== FINISH_STATE) {
      var bstate = s.strategy === Z_HUFFMAN_ONLY ? deflate_huff(s, flush) : s.strategy === Z_RLE ? deflate_rle(s, flush) : configuration_table[s.level].func(s, flush);

      if (bstate === BS_FINISH_STARTED || bstate === BS_FINISH_DONE) {
        s.status = FINISH_STATE;
      }

      if (bstate === BS_NEED_MORE || bstate === BS_FINISH_STARTED) {
        if (strm.avail_out === 0) {
          s.last_flush = -1;
          /* avoid BUF_ERROR next call, see above */
        }

        return Z_OK;
        /* If flush != Z_NO_FLUSH && avail_out == 0, the next call
         * of deflate should use the same flush parameter to make sure
         * that the flush is complete. So we don't have to output an
         * empty block here, this will be done at next call. This also
         * ensures that for a very small output buffer, we emit at most
         * one empty block.
         */
      }

      if (bstate === BS_BLOCK_DONE) {
        if (flush === Z_PARTIAL_FLUSH) {
          _tr_align(s);
        } else if (flush !== Z_BLOCK) {
          /* FULL_FLUSH or SYNC_FLUSH */
          _tr_stored_block(s, 0, 0, false);
          /* For a full flush, this empty block will be recognized
           * as a special marker by inflate_sync().
           */


          if (flush === Z_FULL_FLUSH) {
            /*** CLEAR_HASH(s); ***/

            /* forget history */
            zero$1(s.head); // Fill with NIL (= 0);

            if (s.lookahead === 0) {
              s.strstart = 0;
              s.block_start = 0;
              s.insert = 0;
            }
          }
        }

        flush_pending(strm);

        if (strm.avail_out === 0) {
          s.last_flush = -1;
          /* avoid BUF_ERROR at next call, see above */

          return Z_OK;
        }
      }
    } //Assert(strm->avail_out > 0, "bug2");
    //if (strm.avail_out <= 0) { throw new Error("bug2");}


    if (flush !== Z_FINISH) {
      return Z_OK;
    }

    if (s.wrap <= 0) {
      return Z_STREAM_END;
    }
    /* Write the trailer */


    if (s.wrap === 2) {
      put_byte(s, strm.adler & 0xff);
      put_byte(s, strm.adler >> 8 & 0xff);
      put_byte(s, strm.adler >> 16 & 0xff);
      put_byte(s, strm.adler >> 24 & 0xff);
      put_byte(s, strm.total_in & 0xff);
      put_byte(s, strm.total_in >> 8 & 0xff);
      put_byte(s, strm.total_in >> 16 & 0xff);
      put_byte(s, strm.total_in >> 24 & 0xff);
    } else {
      putShortMSB(s, strm.adler >>> 16);
      putShortMSB(s, strm.adler & 0xffff);
    }

    flush_pending(strm);
    /* If avail_out is zero, the application will call deflate again
     * to flush the rest.
     */

    if (s.wrap > 0) {
      s.wrap = -s.wrap;
    }
    /* write the trailer only once! */


    return s.pending !== 0 ? Z_OK : Z_STREAM_END;
  }
  function deflateEnd(strm) {
    var status;

    if (!strm
    /*== Z_NULL*/
    || !strm.state
    /*== Z_NULL*/
    ) {
        return Z_STREAM_ERROR;
      }

    status = strm.state.status;

    if (status !== INIT_STATE && status !== EXTRA_STATE && status !== NAME_STATE && status !== COMMENT_STATE && status !== HCRC_STATE && status !== BUSY_STATE && status !== FINISH_STATE) {
      return err(strm, Z_STREAM_ERROR);
    }

    strm.state = null;
    return status === BUSY_STATE ? err(strm, Z_DATA_ERROR) : Z_OK;
  }
  /* Not implemented
  exports.deflateBound = deflateBound;
  exports.deflateCopy = deflateCopy;
  exports.deflateParams = deflateParams;
  exports.deflatePending = deflatePending;
  exports.deflatePrime = deflatePrime;
  exports.deflateTune = deflateTune;
  */

  // See state defs from inflate.js
  var BAD = 30;
  /* got a data error -- remain here until reset */

  var TYPE = 12;
  /* i: waiting for type bits, including last-flag bit */

  /*
     Decode literal, length, and distance codes and write out the resulting
     literal and match bytes until either not enough input or output is
     available, an end-of-block is encountered, or a data error is encountered.
     When large enough input and output buffers are supplied to inflate(), for
     example, a 16K input buffer and a 64K output buffer, more than 95% of the
     inflate execution time is spent in this routine.

     Entry assumptions:

          state.mode === LEN
          strm.avail_in >= 6
          strm.avail_out >= 258
          start >= strm.avail_out
          state.bits < 8

     On return, state.mode is one of:

          LEN -- ran out of enough output space or enough available input
          TYPE -- reached end of block code, inflate() to interpret next block
          BAD -- error in block data

     Notes:

      - The maximum input bits used by a length/distance pair is 15 bits for the
        length code, 5 bits for the length extra, 15 bits for the distance code,
        and 13 bits for the distance extra.  This totals 48 bits, or six bytes.
        Therefore if strm.avail_in >= 6, then there is enough input to avoid
        checking for available input while decoding.

      - The maximum bytes that a single length/distance pair can output is 258
        bytes, which is the maximum length that can be coded.  inflate_fast()
        requires strm.avail_out >= 258 for each loop to avoid checking for
        output space.
   */

  function inflate_fast(strm, start) {
    var state;

    var _in;
    /* local strm.input */


    var last;
    /* have enough input while in < last */

    var _out;
    /* local strm.output */


    var beg;
    /* inflate()'s initial strm.output */

    var end;
    /* while out < end, enough space available */
    //#ifdef INFLATE_STRICT

    var dmax;
    /* maximum distance from zlib header */
    //#endif

    var wsize;
    /* window size or zero if not using window */

    var whave;
    /* valid bytes in the window */

    var wnext;
    /* window write index */
    // Use `s_window` instead `window`, avoid conflict with instrumentation tools

    var s_window;
    /* allocated sliding window, if wsize != 0 */

    var hold;
    /* local strm.hold */

    var bits;
    /* local strm.bits */

    var lcode;
    /* local strm.lencode */

    var dcode;
    /* local strm.distcode */

    var lmask;
    /* mask for first level of length codes */

    var dmask;
    /* mask for first level of distance codes */

    var here;
    /* retrieved table entry */

    var op;
    /* code bits, operation, extra bits, or */

    /*  window position, window bytes to copy */

    var len;
    /* match length, unused bytes */

    var dist;
    /* match distance */

    var from;
    /* where to copy match from */

    var from_source;
    var input, output; // JS specific, because we have no pointers

    /* copy state to local variables */

    state = strm.state; //here = state.here;

    _in = strm.next_in;
    input = strm.input;
    last = _in + (strm.avail_in - 5);
    _out = strm.next_out;
    output = strm.output;
    beg = _out - (start - strm.avail_out);
    end = _out + (strm.avail_out - 257); //#ifdef INFLATE_STRICT

    dmax = state.dmax; //#endif

    wsize = state.wsize;
    whave = state.whave;
    wnext = state.wnext;
    s_window = state.window;
    hold = state.hold;
    bits = state.bits;
    lcode = state.lencode;
    dcode = state.distcode;
    lmask = (1 << state.lenbits) - 1;
    dmask = (1 << state.distbits) - 1;
    /* decode literals and length/distances until end-of-block or not enough
       input data or output space */

    top: do {
      if (bits < 15) {
        hold += input[_in++] << bits;
        bits += 8;
        hold += input[_in++] << bits;
        bits += 8;
      }

      here = lcode[hold & lmask];

      dolen: for (;;) {
        // Goto emulation
        op = here >>> 24
        /*here.bits*/
        ;
        hold >>>= op;
        bits -= op;
        op = here >>> 16 & 0xff
        /*here.op*/
        ;

        if (op === 0) {
          /* literal */
          //Tracevv((stderr, here.val >= 0x20 && here.val < 0x7f ?
          //        "inflate:         literal '%c'\n" :
          //        "inflate:         literal 0x%02x\n", here.val));
          output[_out++] = here & 0xffff
          /*here.val*/
          ;
        } else if (op & 16) {
          /* length base */
          len = here & 0xffff
          /*here.val*/
          ;
          op &= 15;
          /* number of extra bits */

          if (op) {
            if (bits < op) {
              hold += input[_in++] << bits;
              bits += 8;
            }

            len += hold & (1 << op) - 1;
            hold >>>= op;
            bits -= op;
          } //Tracevv((stderr, "inflate:         length %u\n", len));


          if (bits < 15) {
            hold += input[_in++] << bits;
            bits += 8;
            hold += input[_in++] << bits;
            bits += 8;
          }

          here = dcode[hold & dmask];

          dodist: for (;;) {
            // goto emulation
            op = here >>> 24
            /*here.bits*/
            ;
            hold >>>= op;
            bits -= op;
            op = here >>> 16 & 0xff
            /*here.op*/
            ;

            if (op & 16) {
              /* distance base */
              dist = here & 0xffff
              /*here.val*/
              ;
              op &= 15;
              /* number of extra bits */

              if (bits < op) {
                hold += input[_in++] << bits;
                bits += 8;

                if (bits < op) {
                  hold += input[_in++] << bits;
                  bits += 8;
                }
              }

              dist += hold & (1 << op) - 1; //#ifdef INFLATE_STRICT

              if (dist > dmax) {
                strm.msg = 'invalid distance too far back';
                state.mode = BAD;
                break top;
              } //#endif


              hold >>>= op;
              bits -= op; //Tracevv((stderr, "inflate:         distance %u\n", dist));

              op = _out - beg;
              /* max distance in output */

              if (dist > op) {
                /* see if copy from window */
                op = dist - op;
                /* distance back in window */

                if (op > whave) {
                  if (state.sane) {
                    strm.msg = 'invalid distance too far back';
                    state.mode = BAD;
                    break top;
                  } // (!) This block is disabled in zlib defailts,
                  // don't enable it for binary compatibility
                  //#ifdef INFLATE_ALLOW_INVALID_DISTANCE_TOOFAR_ARRR
                  //                if (len <= op - whave) {
                  //                  do {
                  //                    output[_out++] = 0;
                  //                  } while (--len);
                  //                  continue top;
                  //                }
                  //                len -= op - whave;
                  //                do {
                  //                  output[_out++] = 0;
                  //                } while (--op > whave);
                  //                if (op === 0) {
                  //                  from = _out - dist;
                  //                  do {
                  //                    output[_out++] = output[from++];
                  //                  } while (--len);
                  //                  continue top;
                  //                }
                  //#endif

                }

                from = 0; // window index

                from_source = s_window;

                if (wnext === 0) {
                  /* very common case */
                  from += wsize - op;

                  if (op < len) {
                    /* some from window */
                    len -= op;

                    do {
                      output[_out++] = s_window[from++];
                    } while (--op);

                    from = _out - dist;
                    /* rest from output */

                    from_source = output;
                  }
                } else if (wnext < op) {
                  /* wrap around window */
                  from += wsize + wnext - op;
                  op -= wnext;

                  if (op < len) {
                    /* some from end of window */
                    len -= op;

                    do {
                      output[_out++] = s_window[from++];
                    } while (--op);

                    from = 0;

                    if (wnext < len) {
                      /* some from start of window */
                      op = wnext;
                      len -= op;

                      do {
                        output[_out++] = s_window[from++];
                      } while (--op);

                      from = _out - dist;
                      /* rest from output */

                      from_source = output;
                    }
                  }
                } else {
                  /* contiguous in window */
                  from += wnext - op;

                  if (op < len) {
                    /* some from window */
                    len -= op;

                    do {
                      output[_out++] = s_window[from++];
                    } while (--op);

                    from = _out - dist;
                    /* rest from output */

                    from_source = output;
                  }
                }

                while (len > 2) {
                  output[_out++] = from_source[from++];
                  output[_out++] = from_source[from++];
                  output[_out++] = from_source[from++];
                  len -= 3;
                }

                if (len) {
                  output[_out++] = from_source[from++];

                  if (len > 1) {
                    output[_out++] = from_source[from++];
                  }
                }
              } else {
                from = _out - dist;
                /* copy direct from output */

                do {
                  /* minimum length is three */
                  output[_out++] = output[from++];
                  output[_out++] = output[from++];
                  output[_out++] = output[from++];
                  len -= 3;
                } while (len > 2);

                if (len) {
                  output[_out++] = output[from++];

                  if (len > 1) {
                    output[_out++] = output[from++];
                  }
                }
              }
            } else if ((op & 64) === 0) {
              /* 2nd level distance code */
              here = dcode[(here & 0xffff) + (
              /*here.val*/
              hold & (1 << op) - 1)];
              continue dodist;
            } else {
              strm.msg = 'invalid distance code';
              state.mode = BAD;
              break top;
            }

            break; // need to emulate goto via "continue"
          }
        } else if ((op & 64) === 0) {
          /* 2nd level length code */
          here = lcode[(here & 0xffff) + (
          /*here.val*/
          hold & (1 << op) - 1)];
          continue dolen;
        } else if (op & 32) {
          /* end-of-block */
          //Tracevv((stderr, "inflate:         end of block\n"));
          state.mode = TYPE;
          break top;
        } else {
          strm.msg = 'invalid literal/length code';
          state.mode = BAD;
          break top;
        }

        break; // need to emulate goto via "continue"
      }
    } while (_in < last && _out < end);
    /* return unused bytes (on entry, bits < 8, so in won't go too far back) */


    len = bits >> 3;
    _in -= len;
    bits -= len << 3;
    hold &= (1 << bits) - 1;
    /* update state and return */

    strm.next_in = _in;
    strm.next_out = _out;
    strm.avail_in = _in < last ? 5 + (last - _in) : 5 - (_in - last);
    strm.avail_out = _out < end ? 257 + (end - _out) : 257 - (_out - end);
    state.hold = hold;
    state.bits = bits;
    return;
  }

  var MAXBITS = 15;
  var ENOUGH_LENS = 852;
  var ENOUGH_DISTS = 592; //var ENOUGH = (ENOUGH_LENS+ENOUGH_DISTS);

  var CODES = 0;
  var LENS = 1;
  var DISTS = 2;
  var lbase = [
  /* Length codes 257..285 base */
  3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 15, 17, 19, 23, 27, 31, 35, 43, 51, 59, 67, 83, 99, 115, 131, 163, 195, 227, 258, 0, 0];
  var lext = [
  /* Length codes 257..285 extra */
  16, 16, 16, 16, 16, 16, 16, 16, 17, 17, 17, 17, 18, 18, 18, 18, 19, 19, 19, 19, 20, 20, 20, 20, 21, 21, 21, 21, 16, 72, 78];
  var dbase = [
  /* Distance codes 0..29 base */
  1, 2, 3, 4, 5, 7, 9, 13, 17, 25, 33, 49, 65, 97, 129, 193, 257, 385, 513, 769, 1025, 1537, 2049, 3073, 4097, 6145, 8193, 12289, 16385, 24577, 0, 0];
  var dext = [
  /* Distance codes 0..29 extra */
  16, 16, 16, 16, 17, 17, 18, 18, 19, 19, 20, 20, 21, 21, 22, 22, 23, 23, 24, 24, 25, 25, 26, 26, 27, 27, 28, 28, 29, 29, 64, 64];
  function inflate_table(type, lens, lens_index, codes, table, table_index, work, opts) {
    var bits = opts.bits; //here = opts.here; /* table entry for duplication */

    var len = 0;
    /* a code's length in bits */

    var sym = 0;
    /* index of code symbols */

    var min = 0,
        max = 0;
    /* minimum and maximum code lengths */

    var root = 0;
    /* number of index bits for root table */

    var curr = 0;
    /* number of index bits for current table */

    var drop = 0;
    /* code bits to drop for sub-table */

    var left = 0;
    /* number of prefix codes available */

    var used = 0;
    /* code entries in table used */

    var huff = 0;
    /* Huffman code */

    var incr;
    /* for incrementing code, index */

    var fill;
    /* index for replicating entries */

    var low;
    /* low bits for current root entry */

    var mask;
    /* mask for low root bits */

    var next;
    /* next available space in table */

    var base = null;
    /* base value table to use */

    var base_index = 0; //  var shoextra;    /* extra bits table to use */

    var end;
    /* use base and extra for symbol > end */

    var count = new Buf16(MAXBITS + 1); //[MAXBITS+1];    /* number of codes of each length */

    var offs = new Buf16(MAXBITS + 1); //[MAXBITS+1];     /* offsets in table for each length */

    var extra = null;
    var extra_index = 0;
    var here_bits, here_op, here_val;
    /*
     Process a set of code lengths to create a canonical Huffman code.  The
     code lengths are lens[0..codes-1].  Each length corresponds to the
     symbols 0..codes-1.  The Huffman code is generated by first sorting the
     symbols by length from short to long, and retaining the symbol order
     for codes with equal lengths.  Then the code starts with all zero bits
     for the first code of the shortest length, and the codes are integer
     increments for the same length, and zeros are appended as the length
     increases.  For the deflate format, these bits are stored backwards
     from their more natural integer increment ordering, and so when the
     decoding tables are built in the large loop below, the integer codes
     are incremented backwards.
      This routine assumes, but does not check, that all of the entries in
     lens[] are in the range 0..MAXBITS.  The caller must assure this.
     1..MAXBITS is interpreted as that code length.  zero means that that
     symbol does not occur in this code.
      The codes are sorted by computing a count of codes for each length,
     creating from that a table of starting indices for each length in the
     sorted table, and then entering the symbols in order in the sorted
     table.  The sorted table is work[], with that space being provided by
     the caller.
      The length counts are used for other purposes as well, i.e. finding
     the minimum and maximum length codes, determining if there are any
     codes at all, checking for a valid set of lengths, and looking ahead
     at length counts to determine sub-table sizes when building the
     decoding tables.
     */

    /* accumulate lengths for codes (assumes lens[] all in 0..MAXBITS) */

    for (len = 0; len <= MAXBITS; len++) {
      count[len] = 0;
    }

    for (sym = 0; sym < codes; sym++) {
      count[lens[lens_index + sym]]++;
    }
    /* bound code lengths, force root to be within code lengths */


    root = bits;

    for (max = MAXBITS; max >= 1; max--) {
      if (count[max] !== 0) {
        break;
      }
    }

    if (root > max) {
      root = max;
    }

    if (max === 0) {
      /* no symbols to code at all */
      //table.op[opts.table_index] = 64;  //here.op = (var char)64;    /* invalid code marker */
      //table.bits[opts.table_index] = 1;   //here.bits = (var char)1;
      //table.val[opts.table_index++] = 0;   //here.val = (var short)0;
      table[table_index++] = 1 << 24 | 64 << 16 | 0; //table.op[opts.table_index] = 64;
      //table.bits[opts.table_index] = 1;
      //table.val[opts.table_index++] = 0;

      table[table_index++] = 1 << 24 | 64 << 16 | 0;
      opts.bits = 1;
      return 0;
      /* no symbols, but wait for decoding to report error */
    }

    for (min = 1; min < max; min++) {
      if (count[min] !== 0) {
        break;
      }
    }

    if (root < min) {
      root = min;
    }
    /* check for an over-subscribed or incomplete set of lengths */


    left = 1;

    for (len = 1; len <= MAXBITS; len++) {
      left <<= 1;
      left -= count[len];

      if (left < 0) {
        return -1;
      }
      /* over-subscribed */

    }

    if (left > 0 && (type === CODES || max !== 1)) {
      return -1;
      /* incomplete set */
    }
    /* generate offsets into symbol table for each length for sorting */


    offs[1] = 0;

    for (len = 1; len < MAXBITS; len++) {
      offs[len + 1] = offs[len] + count[len];
    }
    /* sort symbols by length, by symbol order within each length */


    for (sym = 0; sym < codes; sym++) {
      if (lens[lens_index + sym] !== 0) {
        work[offs[lens[lens_index + sym]]++] = sym;
      }
    }
    /*
     Create and fill in decoding tables.  In this loop, the table being
     filled is at next and has curr index bits.  The code being used is huff
     with length len.  That code is converted to an index by dropping drop
     bits off of the bottom.  For codes where len is less than drop + curr,
     those top drop + curr - len bits are incremented through all values to
     fill the table with replicated entries.
      root is the number of index bits for the root table.  When len exceeds
     root, sub-tables are created pointed to by the root entry with an index
     of the low root bits of huff.  This is saved in low to check for when a
     new sub-table should be started.  drop is zero when the root table is
     being filled, and drop is root when sub-tables are being filled.
      When a new sub-table is needed, it is necessary to look ahead in the
     code lengths to determine what size sub-table is needed.  The length
     counts are used for this, and so count[] is decremented as codes are
     entered in the tables.
      used keeps track of how many table entries have been allocated from the
     provided *table space.  It is checked for LENS and DIST tables against
     the constants ENOUGH_LENS and ENOUGH_DISTS to guard against changes in
     the initial root table size constants.  See the comments in inftrees.h
     for more information.
      sym increments through all symbols, and the loop terminates when
     all codes of length max, i.e. all codes, have been processed.  This
     routine permits incomplete codes, so another loop after this one fills
     in the rest of the decoding tables with invalid code markers.
     */

    /* set up for code type */
    // poor man optimization - use if-else instead of switch,
    // to avoid deopts in old v8


    if (type === CODES) {
      base = extra = work;
      /* dummy value--not used */

      end = 19;
    } else if (type === LENS) {
      base = lbase;
      base_index -= 257;
      extra = lext;
      extra_index -= 257;
      end = 256;
    } else {
      /* DISTS */
      base = dbase;
      extra = dext;
      end = -1;
    }
    /* initialize opts for loop */


    huff = 0;
    /* starting code */

    sym = 0;
    /* starting code symbol */

    len = min;
    /* starting code length */

    next = table_index;
    /* current table to fill in */

    curr = root;
    /* current table index bits */

    drop = 0;
    /* current bits to drop from code for index */

    low = -1;
    /* trigger new sub-table when len > root */

    used = 1 << root;
    /* use root table entries */

    mask = used - 1;
    /* mask for comparing low */

    /* check available table space */

    if (type === LENS && used > ENOUGH_LENS || type === DISTS && used > ENOUGH_DISTS) {
      return 1;
    }
    /* process all codes and make table entries */

    for (;;) {
      /* create table entry */

      here_bits = len - drop;

      if (work[sym] < end) {
        here_op = 0;
        here_val = work[sym];
      } else if (work[sym] > end) {
        here_op = extra[extra_index + work[sym]];
        here_val = base[base_index + work[sym]];
      } else {
        here_op = 32 + 64;
        /* end of block */

        here_val = 0;
      }
      /* replicate for those indices with low len bits equal to huff */


      incr = 1 << len - drop;
      fill = 1 << curr;
      min = fill;
      /* save offset to next table */

      do {
        fill -= incr;
        table[next + (huff >> drop) + fill] = here_bits << 24 | here_op << 16 | here_val | 0;
      } while (fill !== 0);
      /* backwards increment the len-bit code huff */


      incr = 1 << len - 1;

      while (huff & incr) {
        incr >>= 1;
      }

      if (incr !== 0) {
        huff &= incr - 1;
        huff += incr;
      } else {
        huff = 0;
      }
      /* go to next symbol, update count, len */


      sym++;

      if (--count[len] === 0) {
        if (len === max) {
          break;
        }

        len = lens[lens_index + work[sym]];
      }
      /* create new sub-table if needed */


      if (len > root && (huff & mask) !== low) {
        /* if first time, transition to sub-tables */
        if (drop === 0) {
          drop = root;
        }
        /* increment past last table */


        next += min;
        /* here min is 1 << curr */

        /* determine length of next table */

        curr = len - drop;
        left = 1 << curr;

        while (curr + drop < max) {
          left -= count[curr + drop];

          if (left <= 0) {
            break;
          }

          curr++;
          left <<= 1;
        }
        /* check for enough space */


        used += 1 << curr;

        if (type === LENS && used > ENOUGH_LENS || type === DISTS && used > ENOUGH_DISTS) {
          return 1;
        }
        /* point entry in root table to sub-table */


        low = huff & mask;
        /*table.op[low] = curr;
        table.bits[low] = root;
        table.val[low] = next - opts.table_index;*/

        table[low] = root << 24 | curr << 16 | next - table_index | 0;
      }
    }
    /* fill in remaining table entry if code is incomplete (guaranteed to have
     at most one remaining entry, since if the code is incomplete, the
     maximum code length that was allowed to get this far is one bit) */


    if (huff !== 0) {
      //table.op[next + huff] = 64;            /* invalid code marker */
      //table.bits[next + huff] = len - drop;
      //table.val[next + huff] = 0;
      table[next + huff] = len - drop << 24 | 64 << 16 | 0;
    }
    /* set return parameters */
    //opts.table_index += used;


    opts.bits = root;
    return 0;
  }

  var CODES$1 = 0;
  var LENS$1 = 1;
  var DISTS$1 = 2;
  /* Public constants ==========================================================*/

  /* ===========================================================================*/

  /* Allowed flush values; see deflate() and inflate() below for details */
  //var Z_NO_FLUSH      = 0;
  //var Z_PARTIAL_FLUSH = 1;
  //var Z_SYNC_FLUSH    = 2;
  //var Z_FULL_FLUSH    = 3;

  var Z_FINISH$1 = 4;
  var Z_BLOCK$1 = 5;
  var Z_TREES = 6;
  /* Return codes for the compression/decompression functions. Negative values
   * are errors, positive values are used for special but normal events.
   */

  var Z_OK$1 = 0;
  var Z_STREAM_END$1 = 1;
  var Z_NEED_DICT = 2; //var Z_ERRNO         = -1;

  var Z_STREAM_ERROR$1 = -2;
  var Z_DATA_ERROR$1 = -3;
  var Z_MEM_ERROR = -4;
  var Z_BUF_ERROR$1 = -5; //var Z_VERSION_ERROR = -6;

  /* The deflate compression method */

  var Z_DEFLATED$1 = 8;
  /* STATES ====================================================================*/

  /* ===========================================================================*/

  var HEAD = 1;
  /* i: waiting for magic header */

  var FLAGS = 2;
  /* i: waiting for method and flags (gzip) */

  var TIME = 3;
  /* i: waiting for modification time (gzip) */

  var OS = 4;
  /* i: waiting for extra flags and operating system (gzip) */

  var EXLEN = 5;
  /* i: waiting for extra length (gzip) */

  var EXTRA = 6;
  /* i: waiting for extra bytes (gzip) */

  var NAME = 7;
  /* i: waiting for end of file name (gzip) */

  var COMMENT = 8;
  /* i: waiting for end of comment (gzip) */

  var HCRC = 9;
  /* i: waiting for header crc (gzip) */

  var DICTID = 10;
  /* i: waiting for dictionary check value */

  var DICT = 11;
  /* waiting for inflateSetDictionary() call */

  var TYPE$1 = 12;
  /* i: waiting for type bits, including last-flag bit */

  var TYPEDO = 13;
  /* i: same, but skip check to exit inflate on new block */

  var STORED = 14;
  /* i: waiting for stored size (length and complement) */

  var COPY_ = 15;
  /* i/o: same as COPY below, but only first time in */

  var COPY = 16;
  /* i/o: waiting for input or output to copy stored block */

  var TABLE = 17;
  /* i: waiting for dynamic block table lengths */

  var LENLENS = 18;
  /* i: waiting for code length code lengths */

  var CODELENS = 19;
  /* i: waiting for length/lit and distance code lengths */

  var LEN_ = 20;
  /* i: same as LEN below, but only first time in */

  var LEN = 21;
  /* i: waiting for length/lit/eob code */

  var LENEXT = 22;
  /* i: waiting for length extra bits */

  var DIST = 23;
  /* i: waiting for distance code */

  var DISTEXT = 24;
  /* i: waiting for distance extra bits */

  var MATCH = 25;
  /* o: waiting for output space to copy string */

  var LIT = 26;
  /* o: waiting for output space to write literal */

  var CHECK = 27;
  /* i: waiting for 32-bit check value */

  var LENGTH = 28;
  /* i: waiting for 32-bit length (gzip) */

  var DONE = 29;
  /* finished check, done -- remain here until reset */

  var BAD$1 = 30;
  /* got a data error -- remain here until reset */

  var MEM = 31;
  /* got an inflate() memory error -- remain here until reset */

  var SYNC = 32;
  /* looking for synchronization bytes to restart inflate() */

  /* ===========================================================================*/

  var ENOUGH_LENS$1 = 852;
  var ENOUGH_DISTS$1 = 592; //var ENOUGH =  (ENOUGH_LENS+ENOUGH_DISTS);

  function zswap32(q) {
    return (q >>> 24 & 0xff) + (q >>> 8 & 0xff00) + ((q & 0xff00) << 8) + ((q & 0xff) << 24);
  }

  function InflateState() {
    this.mode = 0;
    /* current inflate mode */

    this.last = false;
    /* true if processing last block */

    this.wrap = 0;
    /* bit 0 true for zlib, bit 1 true for gzip */

    this.havedict = false;
    /* true if dictionary provided */

    this.flags = 0;
    /* gzip header method and flags (0 if zlib) */

    this.dmax = 0;
    /* zlib header max distance (INFLATE_STRICT) */

    this.check = 0;
    /* protected copy of check value */

    this.total = 0;
    /* protected copy of output count */
    // TODO: may be {}

    this.head = null;
    /* where to save gzip header information */

    /* sliding window */

    this.wbits = 0;
    /* log base 2 of requested window size */

    this.wsize = 0;
    /* window size or zero if not using window */

    this.whave = 0;
    /* valid bytes in the window */

    this.wnext = 0;
    /* window write index */

    this.window = null;
    /* allocated sliding window, if needed */

    /* bit accumulator */

    this.hold = 0;
    /* input bit accumulator */

    this.bits = 0;
    /* number of bits in "in" */

    /* for string and stored block copying */

    this.length = 0;
    /* literal or length of data to copy */

    this.offset = 0;
    /* distance back to copy string from */

    /* for table and code decoding */

    this.extra = 0;
    /* extra bits needed */

    /* fixed and dynamic code tables */

    this.lencode = null;
    /* starting table for length/literal codes */

    this.distcode = null;
    /* starting table for distance codes */

    this.lenbits = 0;
    /* index bits for lencode */

    this.distbits = 0;
    /* index bits for distcode */

    /* dynamic table building */

    this.ncode = 0;
    /* number of code length code lengths */

    this.nlen = 0;
    /* number of length code lengths */

    this.ndist = 0;
    /* number of distance code lengths */

    this.have = 0;
    /* number of code lengths in lens[] */

    this.next = null;
    /* next available space in codes[] */

    this.lens = new Buf16(320);
    /* temporary storage for code lengths */

    this.work = new Buf16(288);
    /* work area for code table building */

    /*
     because we don't have pointers in js, we use lencode and distcode directly
     as buffers so we don't need codes
    */
    //this.codes = new Buf32(ENOUGH);       /* space for code tables */

    this.lendyn = null;
    /* dynamic table for length/literal codes (JS specific) */

    this.distdyn = null;
    /* dynamic table for distance codes (JS specific) */

    this.sane = 0;
    /* if false, allow invalid distance too far */

    this.back = 0;
    /* bits back of last unprocessed length/lit */

    this.was = 0;
    /* initial length of match */
  }

  function inflateResetKeep(strm) {
    var state;

    if (!strm || !strm.state) {
      return Z_STREAM_ERROR$1;
    }

    state = strm.state;
    strm.total_in = strm.total_out = state.total = 0;
    strm.msg = '';
    /*Z_NULL*/

    if (state.wrap) {
      /* to support ill-conceived Java test suite */
      strm.adler = state.wrap & 1;
    }

    state.mode = HEAD;
    state.last = 0;
    state.havedict = 0;
    state.dmax = 32768;
    state.head = null
    /*Z_NULL*/
    ;
    state.hold = 0;
    state.bits = 0; //state.lencode = state.distcode = state.next = state.codes;

    state.lencode = state.lendyn = new Buf32(ENOUGH_LENS$1);
    state.distcode = state.distdyn = new Buf32(ENOUGH_DISTS$1);
    state.sane = 1;
    state.back = -1; //Tracev((stderr, "inflate: reset\n"));

    return Z_OK$1;
  }
  function inflateReset(strm) {
    var state;

    if (!strm || !strm.state) {
      return Z_STREAM_ERROR$1;
    }

    state = strm.state;
    state.wsize = 0;
    state.whave = 0;
    state.wnext = 0;
    return inflateResetKeep(strm);
  }
  function inflateReset2(strm, windowBits) {
    var wrap;
    var state;
    /* get the state */

    if (!strm || !strm.state) {
      return Z_STREAM_ERROR$1;
    }

    state = strm.state;
    /* extract wrap request from windowBits parameter */

    if (windowBits < 0) {
      wrap = 0;
      windowBits = -windowBits;
    } else {
      wrap = (windowBits >> 4) + 1;

      if (windowBits < 48) {
        windowBits &= 15;
      }
    }
    /* set number of window bits, free window if different */


    if (windowBits && (windowBits < 8 || windowBits > 15)) {
      return Z_STREAM_ERROR$1;
    }

    if (state.window !== null && state.wbits !== windowBits) {
      state.window = null;
    }
    /* update state and reset the rest of it */


    state.wrap = wrap;
    state.wbits = windowBits;
    return inflateReset(strm);
  }
  function inflateInit2(strm, windowBits) {
    var ret;
    var state;

    if (!strm) {
      return Z_STREAM_ERROR$1;
    } //strm.msg = Z_NULL;                 /* in case we return an error */


    state = new InflateState(); //if (state === Z_NULL) return Z_MEM_ERROR;
    //Tracev((stderr, "inflate: allocated\n"));

    strm.state = state;
    state.window = null
    /*Z_NULL*/
    ;
    ret = inflateReset2(strm, windowBits);

    if (ret !== Z_OK$1) {
      strm.state = null
      /*Z_NULL*/
      ;
    }

    return ret;
  }
  /*
   Return state with length and distance decoding tables and index sizes set to
   fixed code decoding.  Normally this returns fixed tables from inffixed.h.
   If BUILDFIXED is defined, then instead this routine builds the tables the
   first time it's called, and returns those tables the first time and
   thereafter.  This reduces the size of the code by about 2K bytes, in
   exchange for a little execution time.  However, BUILDFIXED should not be
   used for threaded applications, since the rewriting of the tables and virgin
   may not be thread-safe.
   */

  var virgin = true;
  var lenfix, distfix; // We have no pointers in JS, so keep tables separate

  function fixedtables(state) {
    /* build fixed huffman tables if first call (may not be thread safe) */
    if (virgin) {
      var sym;
      lenfix = new Buf32(512);
      distfix = new Buf32(32);
      /* literal/length table */

      sym = 0;

      while (sym < 144) {
        state.lens[sym++] = 8;
      }

      while (sym < 256) {
        state.lens[sym++] = 9;
      }

      while (sym < 280) {
        state.lens[sym++] = 7;
      }

      while (sym < 288) {
        state.lens[sym++] = 8;
      }

      inflate_table(LENS$1, state.lens, 0, 288, lenfix, 0, state.work, {
        bits: 9
      });
      /* distance table */

      sym = 0;

      while (sym < 32) {
        state.lens[sym++] = 5;
      }

      inflate_table(DISTS$1, state.lens, 0, 32, distfix, 0, state.work, {
        bits: 5
      });
      /* do this just once */

      virgin = false;
    }

    state.lencode = lenfix;
    state.lenbits = 9;
    state.distcode = distfix;
    state.distbits = 5;
  }
  /*
   Update the window with the last wsize (normally 32K) bytes written before
   returning.  If window does not exist yet, create it.  This is only called
   when a window is already in use, or when output has been written during this
   inflate call, but the end of the deflate stream has not been reached yet.
   It is also called to create a window for dictionary data when a dictionary
   is loaded.

   Providing output buffers larger than 32K to inflate() should provide a speed
   advantage, since only the last 32K of output is copied to the sliding window
   upon return from inflate(), and since all distances after the first 32K of
   output will fall in the output data, making match copies simpler and faster.
   The advantage may be dependent on the size of the processor's data caches.
   */


  function updatewindow(strm, src, end, copy) {
    var dist;
    var state = strm.state;
    /* if it hasn't been done already, allocate space for the window */

    if (state.window === null) {
      state.wsize = 1 << state.wbits;
      state.wnext = 0;
      state.whave = 0;
      state.window = new Buf8(state.wsize);
    }
    /* copy state->wsize or less output bytes into the circular window */


    if (copy >= state.wsize) {
      arraySet(state.window, src, end - state.wsize, state.wsize, 0);
      state.wnext = 0;
      state.whave = state.wsize;
    } else {
      dist = state.wsize - state.wnext;

      if (dist > copy) {
        dist = copy;
      } //zmemcpy(state->window + state->wnext, end - copy, dist);


      arraySet(state.window, src, end - copy, dist, state.wnext);
      copy -= dist;

      if (copy) {
        //zmemcpy(state->window, end - copy, copy);
        arraySet(state.window, src, end - copy, copy, 0);
        state.wnext = copy;
        state.whave = state.wsize;
      } else {
        state.wnext += dist;

        if (state.wnext === state.wsize) {
          state.wnext = 0;
        }

        if (state.whave < state.wsize) {
          state.whave += dist;
        }
      }
    }

    return 0;
  }

  function inflate(strm, flush) {
    var state;
    var input, output; // input/output buffers

    var next;
    /* next input INDEX */

    var put;
    /* next output INDEX */

    var have, left;
    /* available input and output */

    var hold;
    /* bit buffer */

    var bits;
    /* bits in bit buffer */

    var _in, _out;
    /* save starting available input and output */


    var copy;
    /* number of stored or match bytes to copy */

    var from;
    /* where to copy match bytes from */

    var from_source;
    var here = 0;
    /* current decoding table entry */

    var here_bits, here_op, here_val; // paked "here" denormalized (JS specific)
    //var last;                   /* parent table entry */

    var last_bits, last_op, last_val; // paked "last" denormalized (JS specific)

    var len;
    /* length to copy for repeats, bits to drop */

    var ret;
    /* return code */

    var hbuf = new Buf8(4);
    /* buffer for gzip header crc calculation */

    var opts;
    var n; // temporary var for NEED_BITS

    var order =
    /* permutation of code lengths */
    [16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15];

    if (!strm || !strm.state || !strm.output || !strm.input && strm.avail_in !== 0) {
      return Z_STREAM_ERROR$1;
    }

    state = strm.state;

    if (state.mode === TYPE$1) {
      state.mode = TYPEDO;
    }
    /* skip check */
    //--- LOAD() ---


    put = strm.next_out;
    output = strm.output;
    left = strm.avail_out;
    next = strm.next_in;
    input = strm.input;
    have = strm.avail_in;
    hold = state.hold;
    bits = state.bits; //---

    _in = have;
    _out = left;
    ret = Z_OK$1;

    inf_leave: // goto emulation
    for (;;) {
      switch (state.mode) {
        case HEAD:
          if (state.wrap === 0) {
            state.mode = TYPEDO;
            break;
          } //=== NEEDBITS(16);


          while (bits < 16) {
            if (have === 0) {
              break inf_leave;
            }

            have--;
            hold += input[next++] << bits;
            bits += 8;
          } //===//


          if (state.wrap & 2 && hold === 0x8b1f) {
            /* gzip header */
            state.check = 0
            /*crc32(0L, Z_NULL, 0)*/
            ; //=== CRC2(state.check, hold);

            hbuf[0] = hold & 0xff;
            hbuf[1] = hold >>> 8 & 0xff;
            state.check = crc32(state.check, hbuf, 2, 0); //===//
            //=== INITBITS();

            hold = 0;
            bits = 0; //===//

            state.mode = FLAGS;
            break;
          }

          state.flags = 0;
          /* expect zlib header */

          if (state.head) {
            state.head.done = false;
          }

          if (!(state.wrap & 1) ||
          /* check if zlib header allowed */
          (((hold & 0xff) <<
          /*BITS(8)*/
          8) + (hold >> 8)) % 31) {
            strm.msg = 'incorrect header check';
            state.mode = BAD$1;
            break;
          }

          if ((hold & 0x0f) !==
          /*BITS(4)*/
          Z_DEFLATED$1) {
            strm.msg = 'unknown compression method';
            state.mode = BAD$1;
            break;
          } //--- DROPBITS(4) ---//


          hold >>>= 4;
          bits -= 4; //---//

          len = (hold & 0x0f) +
          /*BITS(4)*/
          8;

          if (state.wbits === 0) {
            state.wbits = len;
          } else if (len > state.wbits) {
            strm.msg = 'invalid window size';
            state.mode = BAD$1;
            break;
          }

          state.dmax = 1 << len; //Tracev((stderr, "inflate:   zlib header ok\n"));

          strm.adler = state.check = 1
          /*adler32(0L, Z_NULL, 0)*/
          ;
          state.mode = hold & 0x200 ? DICTID : TYPE$1; //=== INITBITS();

          hold = 0;
          bits = 0; //===//

          break;

        case FLAGS:
          //=== NEEDBITS(16); */
          while (bits < 16) {
            if (have === 0) {
              break inf_leave;
            }

            have--;
            hold += input[next++] << bits;
            bits += 8;
          } //===//


          state.flags = hold;

          if ((state.flags & 0xff) !== Z_DEFLATED$1) {
            strm.msg = 'unknown compression method';
            state.mode = BAD$1;
            break;
          }

          if (state.flags & 0xe000) {
            strm.msg = 'unknown header flags set';
            state.mode = BAD$1;
            break;
          }

          if (state.head) {
            state.head.text = hold >> 8 & 1;
          }

          if (state.flags & 0x0200) {
            //=== CRC2(state.check, hold);
            hbuf[0] = hold & 0xff;
            hbuf[1] = hold >>> 8 & 0xff;
            state.check = crc32(state.check, hbuf, 2, 0); //===//
          } //=== INITBITS();


          hold = 0;
          bits = 0; //===//

          state.mode = TIME;

        /* falls through */

        case TIME:
          //=== NEEDBITS(32); */
          while (bits < 32) {
            if (have === 0) {
              break inf_leave;
            }

            have--;
            hold += input[next++] << bits;
            bits += 8;
          } //===//


          if (state.head) {
            state.head.time = hold;
          }

          if (state.flags & 0x0200) {
            //=== CRC4(state.check, hold)
            hbuf[0] = hold & 0xff;
            hbuf[1] = hold >>> 8 & 0xff;
            hbuf[2] = hold >>> 16 & 0xff;
            hbuf[3] = hold >>> 24 & 0xff;
            state.check = crc32(state.check, hbuf, 4, 0); //===
          } //=== INITBITS();


          hold = 0;
          bits = 0; //===//

          state.mode = OS;

        /* falls through */

        case OS:
          //=== NEEDBITS(16); */
          while (bits < 16) {
            if (have === 0) {
              break inf_leave;
            }

            have--;
            hold += input[next++] << bits;
            bits += 8;
          } //===//


          if (state.head) {
            state.head.xflags = hold & 0xff;
            state.head.os = hold >> 8;
          }

          if (state.flags & 0x0200) {
            //=== CRC2(state.check, hold);
            hbuf[0] = hold & 0xff;
            hbuf[1] = hold >>> 8 & 0xff;
            state.check = crc32(state.check, hbuf, 2, 0); //===//
          } //=== INITBITS();


          hold = 0;
          bits = 0; //===//

          state.mode = EXLEN;

        /* falls through */

        case EXLEN:
          if (state.flags & 0x0400) {
            //=== NEEDBITS(16); */
            while (bits < 16) {
              if (have === 0) {
                break inf_leave;
              }

              have--;
              hold += input[next++] << bits;
              bits += 8;
            } //===//


            state.length = hold;

            if (state.head) {
              state.head.extra_len = hold;
            }

            if (state.flags & 0x0200) {
              //=== CRC2(state.check, hold);
              hbuf[0] = hold & 0xff;
              hbuf[1] = hold >>> 8 & 0xff;
              state.check = crc32(state.check, hbuf, 2, 0); //===//
            } //=== INITBITS();


            hold = 0;
            bits = 0; //===//
          } else if (state.head) {
            state.head.extra = null
            /*Z_NULL*/
            ;
          }

          state.mode = EXTRA;

        /* falls through */

        case EXTRA:
          if (state.flags & 0x0400) {
            copy = state.length;

            if (copy > have) {
              copy = have;
            }

            if (copy) {
              if (state.head) {
                len = state.head.extra_len - state.length;

                if (!state.head.extra) {
                  // Use untyped array for more conveniend processing later
                  state.head.extra = new Array(state.head.extra_len);
                }

                arraySet(state.head.extra, input, next, // extra field is limited to 65536 bytes
                // - no need for additional size check
                copy,
                /*len + copy > state.head.extra_max - len ? state.head.extra_max : copy,*/
                len); //zmemcpy(state.head.extra + len, next,
                //        len + copy > state.head.extra_max ?
                //        state.head.extra_max - len : copy);
              }

              if (state.flags & 0x0200) {
                state.check = crc32(state.check, input, copy, next);
              }

              have -= copy;
              next += copy;
              state.length -= copy;
            }

            if (state.length) {
              break inf_leave;
            }
          }

          state.length = 0;
          state.mode = NAME;

        /* falls through */

        case NAME:
          if (state.flags & 0x0800) {
            if (have === 0) {
              break inf_leave;
            }

            copy = 0;

            do {
              // TODO: 2 or 1 bytes?
              len = input[next + copy++];
              /* use constant limit because in js we should not preallocate memory */

              if (state.head && len && state.length < 65536
              /*state.head.name_max*/
              ) {
                state.head.name += String.fromCharCode(len);
              }
            } while (len && copy < have);

            if (state.flags & 0x0200) {
              state.check = crc32(state.check, input, copy, next);
            }

            have -= copy;
            next += copy;

            if (len) {
              break inf_leave;
            }
          } else if (state.head) {
            state.head.name = null;
          }

          state.length = 0;
          state.mode = COMMENT;

        /* falls through */

        case COMMENT:
          if (state.flags & 0x1000) {
            if (have === 0) {
              break inf_leave;
            }

            copy = 0;

            do {
              len = input[next + copy++];
              /* use constant limit because in js we should not preallocate memory */

              if (state.head && len && state.length < 65536
              /*state.head.comm_max*/
              ) {
                state.head.comment += String.fromCharCode(len);
              }
            } while (len && copy < have);

            if (state.flags & 0x0200) {
              state.check = crc32(state.check, input, copy, next);
            }

            have -= copy;
            next += copy;

            if (len) {
              break inf_leave;
            }
          } else if (state.head) {
            state.head.comment = null;
          }

          state.mode = HCRC;

        /* falls through */

        case HCRC:
          if (state.flags & 0x0200) {
            //=== NEEDBITS(16); */
            while (bits < 16) {
              if (have === 0) {
                break inf_leave;
              }

              have--;
              hold += input[next++] << bits;
              bits += 8;
            } //===//


            if (hold !== (state.check & 0xffff)) {
              strm.msg = 'header crc mismatch';
              state.mode = BAD$1;
              break;
            } //=== INITBITS();


            hold = 0;
            bits = 0; //===//
          }

          if (state.head) {
            state.head.hcrc = state.flags >> 9 & 1;
            state.head.done = true;
          }

          strm.adler = state.check = 0;
          state.mode = TYPE$1;
          break;

        case DICTID:
          //=== NEEDBITS(32); */
          while (bits < 32) {
            if (have === 0) {
              break inf_leave;
            }

            have--;
            hold += input[next++] << bits;
            bits += 8;
          } //===//


          strm.adler = state.check = zswap32(hold); //=== INITBITS();

          hold = 0;
          bits = 0; //===//

          state.mode = DICT;

        /* falls through */

        case DICT:
          if (state.havedict === 0) {
            //--- RESTORE() ---
            strm.next_out = put;
            strm.avail_out = left;
            strm.next_in = next;
            strm.avail_in = have;
            state.hold = hold;
            state.bits = bits; //---

            return Z_NEED_DICT;
          }

          strm.adler = state.check = 1
          /*adler32(0L, Z_NULL, 0)*/
          ;
          state.mode = TYPE$1;

        /* falls through */

        case TYPE$1:
          if (flush === Z_BLOCK$1 || flush === Z_TREES) {
            break inf_leave;
          }

        /* falls through */

        case TYPEDO:
          if (state.last) {
            //--- BYTEBITS() ---//
            hold >>>= bits & 7;
            bits -= bits & 7; //---//

            state.mode = CHECK;
            break;
          } //=== NEEDBITS(3); */


          while (bits < 3) {
            if (have === 0) {
              break inf_leave;
            }

            have--;
            hold += input[next++] << bits;
            bits += 8;
          } //===//


          state.last = hold & 0x01
          /*BITS(1)*/
          ; //--- DROPBITS(1) ---//

          hold >>>= 1;
          bits -= 1; //---//

          switch (hold & 0x03) {
            /*BITS(2)*/
            case 0:
              /* stored block */
              //Tracev((stderr, "inflate:     stored block%s\n",
              //        state.last ? " (last)" : ""));
              state.mode = STORED;
              break;

            case 1:
              /* fixed block */
              fixedtables(state); //Tracev((stderr, "inflate:     fixed codes block%s\n",
              //        state.last ? " (last)" : ""));

              state.mode = LEN_;
              /* decode codes */

              if (flush === Z_TREES) {
                //--- DROPBITS(2) ---//
                hold >>>= 2;
                bits -= 2; //---//

                break inf_leave;
              }

              break;

            case 2:
              /* dynamic block */
              //Tracev((stderr, "inflate:     dynamic codes block%s\n",
              //        state.last ? " (last)" : ""));
              state.mode = TABLE;
              break;

            case 3:
              strm.msg = 'invalid block type';
              state.mode = BAD$1;
          } //--- DROPBITS(2) ---//


          hold >>>= 2;
          bits -= 2; //---//

          break;

        case STORED:
          //--- BYTEBITS() ---// /* go to byte boundary */
          hold >>>= bits & 7;
          bits -= bits & 7; //---//
          //=== NEEDBITS(32); */

          while (bits < 32) {
            if (have === 0) {
              break inf_leave;
            }

            have--;
            hold += input[next++] << bits;
            bits += 8;
          } //===//


          if ((hold & 0xffff) !== (hold >>> 16 ^ 0xffff)) {
            strm.msg = 'invalid stored block lengths';
            state.mode = BAD$1;
            break;
          }

          state.length = hold & 0xffff; //Tracev((stderr, "inflate:       stored length %u\n",
          //        state.length));
          //=== INITBITS();

          hold = 0;
          bits = 0; //===//

          state.mode = COPY_;

          if (flush === Z_TREES) {
            break inf_leave;
          }

        /* falls through */

        case COPY_:
          state.mode = COPY;

        /* falls through */

        case COPY:
          copy = state.length;

          if (copy) {
            if (copy > have) {
              copy = have;
            }

            if (copy > left) {
              copy = left;
            }

            if (copy === 0) {
              break inf_leave;
            } //--- zmemcpy(put, next, copy); ---


            arraySet(output, input, next, copy, put); //---//

            have -= copy;
            next += copy;
            left -= copy;
            put += copy;
            state.length -= copy;
            break;
          } //Tracev((stderr, "inflate:       stored end\n"));


          state.mode = TYPE$1;
          break;

        case TABLE:
          //=== NEEDBITS(14); */
          while (bits < 14) {
            if (have === 0) {
              break inf_leave;
            }

            have--;
            hold += input[next++] << bits;
            bits += 8;
          } //===//


          state.nlen = (hold & 0x1f) +
          /*BITS(5)*/
          257; //--- DROPBITS(5) ---//

          hold >>>= 5;
          bits -= 5; //---//

          state.ndist = (hold & 0x1f) +
          /*BITS(5)*/
          1; //--- DROPBITS(5) ---//

          hold >>>= 5;
          bits -= 5; //---//

          state.ncode = (hold & 0x0f) +
          /*BITS(4)*/
          4; //--- DROPBITS(4) ---//

          hold >>>= 4;
          bits -= 4; //---//
          //#ifndef PKZIP_BUG_WORKAROUND

          if (state.nlen > 286 || state.ndist > 30) {
            strm.msg = 'too many length or distance symbols';
            state.mode = BAD$1;
            break;
          } //#endif
          //Tracev((stderr, "inflate:       table sizes ok\n"));


          state.have = 0;
          state.mode = LENLENS;

        /* falls through */

        case LENLENS:
          while (state.have < state.ncode) {
            //=== NEEDBITS(3);
            while (bits < 3) {
              if (have === 0) {
                break inf_leave;
              }

              have--;
              hold += input[next++] << bits;
              bits += 8;
            } //===//


            state.lens[order[state.have++]] = hold & 0x07; //BITS(3);
            //--- DROPBITS(3) ---//

            hold >>>= 3;
            bits -= 3; //---//
          }

          while (state.have < 19) {
            state.lens[order[state.have++]] = 0;
          } // We have separate tables & no pointers. 2 commented lines below not needed.
          //state.next = state.codes;
          //state.lencode = state.next;
          // Switch to use dynamic table


          state.lencode = state.lendyn;
          state.lenbits = 7;
          opts = {
            bits: state.lenbits
          };
          ret = inflate_table(CODES$1, state.lens, 0, 19, state.lencode, 0, state.work, opts);
          state.lenbits = opts.bits;

          if (ret) {
            strm.msg = 'invalid code lengths set';
            state.mode = BAD$1;
            break;
          } //Tracev((stderr, "inflate:       code lengths ok\n"));


          state.have = 0;
          state.mode = CODELENS;

        /* falls through */

        case CODELENS:
          while (state.have < state.nlen + state.ndist) {
            for (;;) {
              here = state.lencode[hold & (1 << state.lenbits) - 1];
              /*BITS(state.lenbits)*/

              here_bits = here >>> 24;
              here_op = here >>> 16 & 0xff;
              here_val = here & 0xffff;

              if (here_bits <= bits) {
                break;
              } //--- PULLBYTE() ---//


              if (have === 0) {
                break inf_leave;
              }

              have--;
              hold += input[next++] << bits;
              bits += 8; //---//
            }

            if (here_val < 16) {
              //--- DROPBITS(here.bits) ---//
              hold >>>= here_bits;
              bits -= here_bits; //---//

              state.lens[state.have++] = here_val;
            } else {
              if (here_val === 16) {
                //=== NEEDBITS(here.bits + 2);
                n = here_bits + 2;

                while (bits < n) {
                  if (have === 0) {
                    break inf_leave;
                  }

                  have--;
                  hold += input[next++] << bits;
                  bits += 8;
                } //===//
                //--- DROPBITS(here.bits) ---//


                hold >>>= here_bits;
                bits -= here_bits; //---//

                if (state.have === 0) {
                  strm.msg = 'invalid bit length repeat';
                  state.mode = BAD$1;
                  break;
                }

                len = state.lens[state.have - 1];
                copy = 3 + (hold & 0x03); //BITS(2);
                //--- DROPBITS(2) ---//

                hold >>>= 2;
                bits -= 2; //---//
              } else if (here_val === 17) {
                //=== NEEDBITS(here.bits + 3);
                n = here_bits + 3;

                while (bits < n) {
                  if (have === 0) {
                    break inf_leave;
                  }

                  have--;
                  hold += input[next++] << bits;
                  bits += 8;
                } //===//
                //--- DROPBITS(here.bits) ---//


                hold >>>= here_bits;
                bits -= here_bits; //---//

                len = 0;
                copy = 3 + (hold & 0x07); //BITS(3);
                //--- DROPBITS(3) ---//

                hold >>>= 3;
                bits -= 3; //---//
              } else {
                //=== NEEDBITS(here.bits + 7);
                n = here_bits + 7;

                while (bits < n) {
                  if (have === 0) {
                    break inf_leave;
                  }

                  have--;
                  hold += input[next++] << bits;
                  bits += 8;
                } //===//
                //--- DROPBITS(here.bits) ---//


                hold >>>= here_bits;
                bits -= here_bits; //---//

                len = 0;
                copy = 11 + (hold & 0x7f); //BITS(7);
                //--- DROPBITS(7) ---//

                hold >>>= 7;
                bits -= 7; //---//
              }

              if (state.have + copy > state.nlen + state.ndist) {
                strm.msg = 'invalid bit length repeat';
                state.mode = BAD$1;
                break;
              }

              while (copy--) {
                state.lens[state.have++] = len;
              }
            }
          }
          /* handle error breaks in while */


          if (state.mode === BAD$1) {
            break;
          }
          /* check for end-of-block code (better have one) */


          if (state.lens[256] === 0) {
            strm.msg = 'invalid code -- missing end-of-block';
            state.mode = BAD$1;
            break;
          }
          /* build code tables -- note: do not change the lenbits or distbits
             values here (9 and 6) without reading the comments in inftrees.h
             concerning the ENOUGH constants, which depend on those values */


          state.lenbits = 9;
          opts = {
            bits: state.lenbits
          };
          ret = inflate_table(LENS$1, state.lens, 0, state.nlen, state.lencode, 0, state.work, opts); // We have separate tables & no pointers. 2 commented lines below not needed.
          // state.next_index = opts.table_index;

          state.lenbits = opts.bits; // state.lencode = state.next;

          if (ret) {
            strm.msg = 'invalid literal/lengths set';
            state.mode = BAD$1;
            break;
          }

          state.distbits = 6; //state.distcode.copy(state.codes);
          // Switch to use dynamic table

          state.distcode = state.distdyn;
          opts = {
            bits: state.distbits
          };
          ret = inflate_table(DISTS$1, state.lens, state.nlen, state.ndist, state.distcode, 0, state.work, opts); // We have separate tables & no pointers. 2 commented lines below not needed.
          // state.next_index = opts.table_index;

          state.distbits = opts.bits; // state.distcode = state.next;

          if (ret) {
            strm.msg = 'invalid distances set';
            state.mode = BAD$1;
            break;
          } //Tracev((stderr, 'inflate:       codes ok\n'));


          state.mode = LEN_;

          if (flush === Z_TREES) {
            break inf_leave;
          }

        /* falls through */

        case LEN_:
          state.mode = LEN;

        /* falls through */

        case LEN:
          if (have >= 6 && left >= 258) {
            //--- RESTORE() ---
            strm.next_out = put;
            strm.avail_out = left;
            strm.next_in = next;
            strm.avail_in = have;
            state.hold = hold;
            state.bits = bits; //---

            inflate_fast(strm, _out); //--- LOAD() ---

            put = strm.next_out;
            output = strm.output;
            left = strm.avail_out;
            next = strm.next_in;
            input = strm.input;
            have = strm.avail_in;
            hold = state.hold;
            bits = state.bits; //---

            if (state.mode === TYPE$1) {
              state.back = -1;
            }

            break;
          }

          state.back = 0;

          for (;;) {
            here = state.lencode[hold & (1 << state.lenbits) - 1];
            /*BITS(state.lenbits)*/

            here_bits = here >>> 24;
            here_op = here >>> 16 & 0xff;
            here_val = here & 0xffff;

            if (here_bits <= bits) {
              break;
            } //--- PULLBYTE() ---//


            if (have === 0) {
              break inf_leave;
            }

            have--;
            hold += input[next++] << bits;
            bits += 8; //---//
          }

          if (here_op && (here_op & 0xf0) === 0) {
            last_bits = here_bits;
            last_op = here_op;
            last_val = here_val;

            for (;;) {
              here = state.lencode[last_val + ((hold & (1 << last_bits + last_op) - 1) >>
              /*BITS(last.bits + last.op)*/
              last_bits)];
              here_bits = here >>> 24;
              here_op = here >>> 16 & 0xff;
              here_val = here & 0xffff;

              if (last_bits + here_bits <= bits) {
                break;
              } //--- PULLBYTE() ---//


              if (have === 0) {
                break inf_leave;
              }

              have--;
              hold += input[next++] << bits;
              bits += 8; //---//
            } //--- DROPBITS(last.bits) ---//


            hold >>>= last_bits;
            bits -= last_bits; //---//

            state.back += last_bits;
          } //--- DROPBITS(here.bits) ---//


          hold >>>= here_bits;
          bits -= here_bits; //---//

          state.back += here_bits;
          state.length = here_val;

          if (here_op === 0) {
            //Tracevv((stderr, here.val >= 0x20 && here.val < 0x7f ?
            //        "inflate:         literal '%c'\n" :
            //        "inflate:         literal 0x%02x\n", here.val));
            state.mode = LIT;
            break;
          }

          if (here_op & 32) {
            //Tracevv((stderr, "inflate:         end of block\n"));
            state.back = -1;
            state.mode = TYPE$1;
            break;
          }

          if (here_op & 64) {
            strm.msg = 'invalid literal/length code';
            state.mode = BAD$1;
            break;
          }

          state.extra = here_op & 15;
          state.mode = LENEXT;

        /* falls through */

        case LENEXT:
          if (state.extra) {
            //=== NEEDBITS(state.extra);
            n = state.extra;

            while (bits < n) {
              if (have === 0) {
                break inf_leave;
              }

              have--;
              hold += input[next++] << bits;
              bits += 8;
            } //===//


            state.length += hold & (1 << state.extra) - 1
            /*BITS(state.extra)*/
            ; //--- DROPBITS(state.extra) ---//

            hold >>>= state.extra;
            bits -= state.extra; //---//

            state.back += state.extra;
          } //Tracevv((stderr, "inflate:         length %u\n", state.length));


          state.was = state.length;
          state.mode = DIST;

        /* falls through */

        case DIST:
          for (;;) {
            here = state.distcode[hold & (1 << state.distbits) - 1];
            /*BITS(state.distbits)*/

            here_bits = here >>> 24;
            here_op = here >>> 16 & 0xff;
            here_val = here & 0xffff;

            if (here_bits <= bits) {
              break;
            } //--- PULLBYTE() ---//


            if (have === 0) {
              break inf_leave;
            }

            have--;
            hold += input[next++] << bits;
            bits += 8; //---//
          }

          if ((here_op & 0xf0) === 0) {
            last_bits = here_bits;
            last_op = here_op;
            last_val = here_val;

            for (;;) {
              here = state.distcode[last_val + ((hold & (1 << last_bits + last_op) - 1) >>
              /*BITS(last.bits + last.op)*/
              last_bits)];
              here_bits = here >>> 24;
              here_op = here >>> 16 & 0xff;
              here_val = here & 0xffff;

              if (last_bits + here_bits <= bits) {
                break;
              } //--- PULLBYTE() ---//


              if (have === 0) {
                break inf_leave;
              }

              have--;
              hold += input[next++] << bits;
              bits += 8; //---//
            } //--- DROPBITS(last.bits) ---//


            hold >>>= last_bits;
            bits -= last_bits; //---//

            state.back += last_bits;
          } //--- DROPBITS(here.bits) ---//


          hold >>>= here_bits;
          bits -= here_bits; //---//

          state.back += here_bits;

          if (here_op & 64) {
            strm.msg = 'invalid distance code';
            state.mode = BAD$1;
            break;
          }

          state.offset = here_val;
          state.extra = here_op & 15;
          state.mode = DISTEXT;

        /* falls through */

        case DISTEXT:
          if (state.extra) {
            //=== NEEDBITS(state.extra);
            n = state.extra;

            while (bits < n) {
              if (have === 0) {
                break inf_leave;
              }

              have--;
              hold += input[next++] << bits;
              bits += 8;
            } //===//


            state.offset += hold & (1 << state.extra) - 1
            /*BITS(state.extra)*/
            ; //--- DROPBITS(state.extra) ---//

            hold >>>= state.extra;
            bits -= state.extra; //---//

            state.back += state.extra;
          } //#ifdef INFLATE_STRICT


          if (state.offset > state.dmax) {
            strm.msg = 'invalid distance too far back';
            state.mode = BAD$1;
            break;
          } //#endif
          //Tracevv((stderr, "inflate:         distance %u\n", state.offset));


          state.mode = MATCH;

        /* falls through */

        case MATCH:
          if (left === 0) {
            break inf_leave;
          }

          copy = _out - left;

          if (state.offset > copy) {
            /* copy from window */
            copy = state.offset - copy;

            if (copy > state.whave) {
              if (state.sane) {
                strm.msg = 'invalid distance too far back';
                state.mode = BAD$1;
                break;
              } // (!) This block is disabled in zlib defailts,
              // don't enable it for binary compatibility
              //#ifdef INFLATE_ALLOW_INVALID_DISTANCE_TOOFAR_ARRR
              //          Trace((stderr, "inflate.c too far\n"));
              //          copy -= state.whave;
              //          if (copy > state.length) { copy = state.length; }
              //          if (copy > left) { copy = left; }
              //          left -= copy;
              //          state.length -= copy;
              //          do {
              //            output[put++] = 0;
              //          } while (--copy);
              //          if (state.length === 0) { state.mode = LEN; }
              //          break;
              //#endif

            }

            if (copy > state.wnext) {
              copy -= state.wnext;
              from = state.wsize - copy;
            } else {
              from = state.wnext - copy;
            }

            if (copy > state.length) {
              copy = state.length;
            }

            from_source = state.window;
          } else {
            /* copy from output */
            from_source = output;
            from = put - state.offset;
            copy = state.length;
          }

          if (copy > left) {
            copy = left;
          }

          left -= copy;
          state.length -= copy;

          do {
            output[put++] = from_source[from++];
          } while (--copy);

          if (state.length === 0) {
            state.mode = LEN;
          }

          break;

        case LIT:
          if (left === 0) {
            break inf_leave;
          }

          output[put++] = state.length;
          left--;
          state.mode = LEN;
          break;

        case CHECK:
          if (state.wrap) {
            //=== NEEDBITS(32);
            while (bits < 32) {
              if (have === 0) {
                break inf_leave;
              }

              have--; // Use '|' insdead of '+' to make sure that result is signed

              hold |= input[next++] << bits;
              bits += 8;
            } //===//


            _out -= left;
            strm.total_out += _out;
            state.total += _out;

            if (_out) {
              strm.adler = state.check =
              /*UPDATE(state.check, put - _out, _out);*/
              state.flags ? crc32(state.check, output, _out, put - _out) : adler32(state.check, output, _out, put - _out);
            }

            _out = left; // NB: crc32 stored as signed 32-bit int, zswap32 returns signed too

            if ((state.flags ? hold : zswap32(hold)) !== state.check) {
              strm.msg = 'incorrect data check';
              state.mode = BAD$1;
              break;
            } //=== INITBITS();


            hold = 0;
            bits = 0; //===//
            //Tracev((stderr, "inflate:   check matches trailer\n"));
          }

          state.mode = LENGTH;

        /* falls through */

        case LENGTH:
          if (state.wrap && state.flags) {
            //=== NEEDBITS(32);
            while (bits < 32) {
              if (have === 0) {
                break inf_leave;
              }

              have--;
              hold += input[next++] << bits;
              bits += 8;
            } //===//


            if (hold !== (state.total & 0xffffffff)) {
              strm.msg = 'incorrect length check';
              state.mode = BAD$1;
              break;
            } //=== INITBITS();


            hold = 0;
            bits = 0; //===//
            //Tracev((stderr, "inflate:   length matches trailer\n"));
          }

          state.mode = DONE;

        /* falls through */

        case DONE:
          ret = Z_STREAM_END$1;
          break inf_leave;

        case BAD$1:
          ret = Z_DATA_ERROR$1;
          break inf_leave;

        case MEM:
          return Z_MEM_ERROR;

        case SYNC:
        /* falls through */

        default:
          return Z_STREAM_ERROR$1;
      }
    } // inf_leave <- here is real place for "goto inf_leave", emulated via "break inf_leave"

    /*
       Return from inflate(), updating the total counts and the check value.
       If there was no progress during the inflate() call, return a buffer
       error.  Call updatewindow() to create and/or update the window state.
       Note: a memory error from inflate() is non-recoverable.
     */
    //--- RESTORE() ---


    strm.next_out = put;
    strm.avail_out = left;
    strm.next_in = next;
    strm.avail_in = have;
    state.hold = hold;
    state.bits = bits; //---

    if (state.wsize || _out !== strm.avail_out && state.mode < BAD$1 && (state.mode < CHECK || flush !== Z_FINISH$1)) {
      if (updatewindow(strm, strm.output, strm.next_out, _out - strm.avail_out)) ;
    }

    _in -= strm.avail_in;
    _out -= strm.avail_out;
    strm.total_in += _in;
    strm.total_out += _out;
    state.total += _out;

    if (state.wrap && _out) {
      strm.adler = state.check =
      /*UPDATE(state.check, strm.next_out - _out, _out);*/
      state.flags ? crc32(state.check, output, _out, strm.next_out - _out) : adler32(state.check, output, _out, strm.next_out - _out);
    }

    strm.data_type = state.bits + (state.last ? 64 : 0) + (state.mode === TYPE$1 ? 128 : 0) + (state.mode === LEN_ || state.mode === COPY_ ? 256 : 0);

    if ((_in === 0 && _out === 0 || flush === Z_FINISH$1) && ret === Z_OK$1) {
      ret = Z_BUF_ERROR$1;
    }

    return ret;
  }
  function inflateEnd(strm) {
    if (!strm || !strm.state
    /*|| strm->zfree == (free_func)0*/
    ) {
        return Z_STREAM_ERROR$1;
      }

    var state = strm.state;

    if (state.window) {
      state.window = null;
    }

    strm.state = null;
    return Z_OK$1;
  }
  /* Not implemented
  exports.inflateCopy = inflateCopy;
  exports.inflateGetDictionary = inflateGetDictionary;
  exports.inflateMark = inflateMark;
  exports.inflatePrime = inflatePrime;
  exports.inflateSync = inflateSync;
  exports.inflateSyncPoint = inflateSyncPoint;
  exports.inflateUndermine = inflateUndermine;
  */

  // zlib modes

  var NONE = 0;
  var DEFLATE = 1;
  var INFLATE = 2;
  var GZIP = 3;
  var GUNZIP = 4;
  var DEFLATERAW = 5;
  var INFLATERAW = 6;
  var UNZIP = 7;
  var Z_NO_FLUSH$1 = 0,
      Z_PARTIAL_FLUSH$1 = 1,
      Z_SYNC_FLUSH = 2,
      Z_FULL_FLUSH$1 = 3,
      Z_FINISH$2 = 4,
      Z_BLOCK$2 = 5,
      Z_TREES$1 = 6,

  /* Return codes for the compression/decompression functions. Negative values
  * are errors, positive values are used for special but normal events.
  */
  Z_OK$2 = 0,
      Z_STREAM_END$2 = 1,
      Z_NEED_DICT$1 = 2,
      Z_ERRNO = -1,
      Z_STREAM_ERROR$2 = -2,
      Z_DATA_ERROR$2 = -3,
      //Z_MEM_ERROR:     -4,
  Z_BUF_ERROR$2 = -5,
      //Z_VERSION_ERROR: -6,

  /* compression levels */
  Z_NO_COMPRESSION = 0,
      Z_BEST_SPEED = 1,
      Z_BEST_COMPRESSION = 9,
      Z_DEFAULT_COMPRESSION$1 = -1,
      Z_FILTERED$1 = 1,
      Z_HUFFMAN_ONLY$1 = 2,
      Z_RLE$1 = 3,
      Z_FIXED$2 = 4,
      Z_DEFAULT_STRATEGY = 0,

  /* Possible values of the data_type field (though see inflate()) */
  Z_BINARY$1 = 0,
      Z_TEXT$1 = 1,
      //Z_ASCII:                1, // = Z_TEXT (deprecated)
  Z_UNKNOWN$2 = 2,

  /* The deflate compression method */
  Z_DEFLATED$2 = 8;
  function Zlib(mode) {
    if (mode < DEFLATE || mode > UNZIP) throw new TypeError('Bad argument');
    this.mode = mode;
    this.init_done = false;
    this.write_in_progress = false;
    this.pending_close = false;
    this.windowBits = 0;
    this.level = 0;
    this.memLevel = 0;
    this.strategy = 0;
    this.dictionary = null;
  }

  Zlib.prototype.init = function (windowBits, level, memLevel, strategy, dictionary) {
    this.windowBits = windowBits;
    this.level = level;
    this.memLevel = memLevel;
    this.strategy = strategy; // dictionary not supported.

    if (this.mode === GZIP || this.mode === GUNZIP) this.windowBits += 16;
    if (this.mode === UNZIP) this.windowBits += 32;
    if (this.mode === DEFLATERAW || this.mode === INFLATERAW) this.windowBits = -this.windowBits;
    this.strm = new ZStream();
    var status;

    switch (this.mode) {
      case DEFLATE:
      case GZIP:
      case DEFLATERAW:
        status = deflateInit2(this.strm, this.level, Z_DEFLATED$2, this.windowBits, this.memLevel, this.strategy);
        break;

      case INFLATE:
      case GUNZIP:
      case INFLATERAW:
      case UNZIP:
        status = inflateInit2(this.strm, this.windowBits);
        break;

      default:
        throw new Error('Unknown mode ' + this.mode);
    }

    if (status !== Z_OK$2) {
      this._error(status);

      return;
    }

    this.write_in_progress = false;
    this.init_done = true;
  };

  Zlib.prototype.params = function () {
    throw new Error('deflateParams Not supported');
  };

  Zlib.prototype._writeCheck = function () {
    if (!this.init_done) throw new Error('write before init');
    if (this.mode === NONE) throw new Error('already finalized');
    if (this.write_in_progress) throw new Error('write already in progress');
    if (this.pending_close) throw new Error('close is pending');
  };

  Zlib.prototype.write = function (flush, input, in_off, in_len, out, out_off, out_len) {
    this._writeCheck();

    this.write_in_progress = true;
    var self = this;
    process.nextTick(function () {
      self.write_in_progress = false;

      var res = self._write(flush, input, in_off, in_len, out, out_off, out_len);

      self.callback(res[0], res[1]);
      if (self.pending_close) self.close();
    });
    return this;
  }; // set method for Node buffers, used by pako


  function bufferSet(data, offset) {
    for (var i = 0; i < data.length; i++) {
      this[offset + i] = data[i];
    }
  }

  Zlib.prototype.writeSync = function (flush, input, in_off, in_len, out, out_off, out_len) {
    this._writeCheck();

    return this._write(flush, input, in_off, in_len, out, out_off, out_len);
  };

  Zlib.prototype._write = function (flush, input, in_off, in_len, out, out_off, out_len) {
    this.write_in_progress = true;

    if (flush !== Z_NO_FLUSH$1 && flush !== Z_PARTIAL_FLUSH$1 && flush !== Z_SYNC_FLUSH && flush !== Z_FULL_FLUSH$1 && flush !== Z_FINISH$2 && flush !== Z_BLOCK$2) {
      throw new Error('Invalid flush value');
    }

    if (input == null) {
      input = new Buffer(0);
      in_len = 0;
      in_off = 0;
    }

    if (out._set) out.set = out._set;else out.set = bufferSet;
    var strm = this.strm;
    strm.avail_in = in_len;
    strm.input = input;
    strm.next_in = in_off;
    strm.avail_out = out_len;
    strm.output = out;
    strm.next_out = out_off;
    var status;

    switch (this.mode) {
      case DEFLATE:
      case GZIP:
      case DEFLATERAW:
        status = deflate(strm, flush);
        break;

      case UNZIP:
      case INFLATE:
      case GUNZIP:
      case INFLATERAW:
        status = inflate(strm, flush);
        break;

      default:
        throw new Error('Unknown mode ' + this.mode);
    }

    if (status !== Z_STREAM_END$2 && status !== Z_OK$2) {
      this._error(status);
    }

    this.write_in_progress = false;
    return [strm.avail_in, strm.avail_out];
  };

  Zlib.prototype.close = function () {
    if (this.write_in_progress) {
      this.pending_close = true;
      return;
    }

    this.pending_close = false;

    if (this.mode === DEFLATE || this.mode === GZIP || this.mode === DEFLATERAW) {
      deflateEnd(this.strm);
    } else {
      inflateEnd(this.strm);
    }

    this.mode = NONE;
  };

  var status;

  Zlib.prototype.reset = function () {
    switch (this.mode) {
      case DEFLATE:
      case DEFLATERAW:
        status = deflateReset(this.strm);
        break;

      case INFLATE:
      case INFLATERAW:
        status = inflateReset(this.strm);
        break;
    }

    if (status !== Z_OK$2) {
      this._error(status);
    }
  };

  Zlib.prototype._error = function (status) {
    this.onerror(msg[status] + ': ' + this.strm.msg, status);
    this.write_in_progress = false;
    if (this.pending_close) this.close();
  };

  var _binding = /*#__PURE__*/Object.freeze({
    NONE: NONE,
    DEFLATE: DEFLATE,
    INFLATE: INFLATE,
    GZIP: GZIP,
    GUNZIP: GUNZIP,
    DEFLATERAW: DEFLATERAW,
    INFLATERAW: INFLATERAW,
    UNZIP: UNZIP,
    Z_NO_FLUSH: Z_NO_FLUSH$1,
    Z_PARTIAL_FLUSH: Z_PARTIAL_FLUSH$1,
    Z_SYNC_FLUSH: Z_SYNC_FLUSH,
    Z_FULL_FLUSH: Z_FULL_FLUSH$1,
    Z_FINISH: Z_FINISH$2,
    Z_BLOCK: Z_BLOCK$2,
    Z_TREES: Z_TREES$1,
    Z_OK: Z_OK$2,
    Z_STREAM_END: Z_STREAM_END$2,
    Z_NEED_DICT: Z_NEED_DICT$1,
    Z_ERRNO: Z_ERRNO,
    Z_STREAM_ERROR: Z_STREAM_ERROR$2,
    Z_DATA_ERROR: Z_DATA_ERROR$2,
    Z_BUF_ERROR: Z_BUF_ERROR$2,
    Z_NO_COMPRESSION: Z_NO_COMPRESSION,
    Z_BEST_SPEED: Z_BEST_SPEED,
    Z_BEST_COMPRESSION: Z_BEST_COMPRESSION,
    Z_DEFAULT_COMPRESSION: Z_DEFAULT_COMPRESSION$1,
    Z_FILTERED: Z_FILTERED$1,
    Z_HUFFMAN_ONLY: Z_HUFFMAN_ONLY$1,
    Z_RLE: Z_RLE$1,
    Z_FIXED: Z_FIXED$2,
    Z_DEFAULT_STRATEGY: Z_DEFAULT_STRATEGY,
    Z_BINARY: Z_BINARY$1,
    Z_TEXT: Z_TEXT$1,
    Z_UNKNOWN: Z_UNKNOWN$2,
    Z_DEFLATED: Z_DEFLATED$2,
    Zlib: Zlib
  });

  // Copyright Joyent, Inc. and other Node contributors.

  function assert(a, msg) {
    if (!a) {
      throw new Error(msg);
    }
  }

  var binding = {};
  Object.keys(_binding).forEach(function (key) {
    binding[key] = _binding[key];
  }); // zlib doesn't provide these, so kludge them in following the same
  // const naming scheme zlib uses.

  binding.Z_MIN_WINDOWBITS = 8;
  binding.Z_MAX_WINDOWBITS = 15;
  binding.Z_DEFAULT_WINDOWBITS = 15; // fewer than 64 bytes per chunk is stupid.
  // technically it could work with as few as 8, but even 64 bytes
  // is absurdly low.  Usually a MB or more is best.

  binding.Z_MIN_CHUNK = 64;
  binding.Z_MAX_CHUNK = Infinity;
  binding.Z_DEFAULT_CHUNK = 16 * 1024;
  binding.Z_MIN_MEMLEVEL = 1;
  binding.Z_MAX_MEMLEVEL = 9;
  binding.Z_DEFAULT_MEMLEVEL = 8;
  binding.Z_MIN_LEVEL = -1;
  binding.Z_MAX_LEVEL = 9;
  binding.Z_DEFAULT_LEVEL = binding.Z_DEFAULT_COMPRESSION; // translation table for return codes.

  var codes = {
    Z_OK: binding.Z_OK,
    Z_STREAM_END: binding.Z_STREAM_END,
    Z_NEED_DICT: binding.Z_NEED_DICT,
    Z_ERRNO: binding.Z_ERRNO,
    Z_STREAM_ERROR: binding.Z_STREAM_ERROR,
    Z_DATA_ERROR: binding.Z_DATA_ERROR,
    Z_MEM_ERROR: binding.Z_MEM_ERROR,
    Z_BUF_ERROR: binding.Z_BUF_ERROR,
    Z_VERSION_ERROR: binding.Z_VERSION_ERROR
  };
  Object.keys(codes).forEach(function (k) {
    codes[codes[k]] = k;
  });
  function createDeflate(o) {
    return new Deflate(o);
  }
  function createInflate(o) {
    return new Inflate(o);
  }
  function createDeflateRaw(o) {
    return new DeflateRaw(o);
  }
  function createInflateRaw(o) {
    return new InflateRaw(o);
  }
  function createGzip(o) {
    return new Gzip(o);
  }
  function createGunzip(o) {
    return new Gunzip(o);
  }
  function createUnzip(o) {
    return new Unzip(o);
  } // Convenience methods.
  // compress/decompress a string or buffer in one step.

  function deflate$1(buffer, opts, callback) {
    if (typeof opts === 'function') {
      callback = opts;
      opts = {};
    }

    return zlibBuffer(new Deflate(opts), buffer, callback);
  }
  function deflateSync(buffer, opts) {
    return zlibBufferSync(new Deflate(opts), buffer);
  }
  function gzip(buffer, opts, callback) {
    if (typeof opts === 'function') {
      callback = opts;
      opts = {};
    }

    return zlibBuffer(new Gzip(opts), buffer, callback);
  }
  function gzipSync(buffer, opts) {
    return zlibBufferSync(new Gzip(opts), buffer);
  }
  function deflateRaw(buffer, opts, callback) {
    if (typeof opts === 'function') {
      callback = opts;
      opts = {};
    }

    return zlibBuffer(new DeflateRaw(opts), buffer, callback);
  }
  function deflateRawSync(buffer, opts) {
    return zlibBufferSync(new DeflateRaw(opts), buffer);
  }
  function unzip(buffer, opts, callback) {
    if (typeof opts === 'function') {
      callback = opts;
      opts = {};
    }

    return zlibBuffer(new Unzip(opts), buffer, callback);
  }
  function unzipSync(buffer, opts) {
    return zlibBufferSync(new Unzip(opts), buffer);
  }
  function inflate$1(buffer, opts, callback) {
    if (typeof opts === 'function') {
      callback = opts;
      opts = {};
    }

    return zlibBuffer(new Inflate(opts), buffer, callback);
  }
  function inflateSync(buffer, opts) {
    return zlibBufferSync(new Inflate(opts), buffer);
  }
  function gunzip(buffer, opts, callback) {
    if (typeof opts === 'function') {
      callback = opts;
      opts = {};
    }

    return zlibBuffer(new Gunzip(opts), buffer, callback);
  }
  function gunzipSync(buffer, opts) {
    return zlibBufferSync(new Gunzip(opts), buffer);
  }
  function inflateRaw(buffer, opts, callback) {
    if (typeof opts === 'function') {
      callback = opts;
      opts = {};
    }

    return zlibBuffer(new InflateRaw(opts), buffer, callback);
  }
  function inflateRawSync(buffer, opts) {
    return zlibBufferSync(new InflateRaw(opts), buffer);
  }

  function zlibBuffer(engine, buffer, callback) {
    var buffers = [];
    var nread = 0;
    engine.on('error', onError);
    engine.on('end', onEnd);
    engine.end(buffer);
    flow();

    function flow() {
      var chunk;

      while (null !== (chunk = engine.read())) {
        buffers.push(chunk);
        nread += chunk.length;
      }

      engine.once('readable', flow);
    }

    function onError(err) {
      engine.removeListener('end', onEnd);
      engine.removeListener('readable', flow);
      callback(err);
    }

    function onEnd() {
      var buf = Buffer.concat(buffers, nread);
      buffers = [];
      callback(null, buf);
      engine.close();
    }
  }

  function zlibBufferSync(engine, buffer) {
    if (typeof buffer === 'string') buffer = new Buffer(buffer);
    if (!Buffer.isBuffer(buffer)) throw new TypeError('Not a string or buffer');
    var flushFlag = binding.Z_FINISH;
    return engine._processChunk(buffer, flushFlag);
  } // generic zlib
  // minimal 2-byte header


  function Deflate(opts) {
    if (!(this instanceof Deflate)) return new Deflate(opts);
    Zlib$1.call(this, opts, binding.DEFLATE);
  }
  function Inflate(opts) {
    if (!(this instanceof Inflate)) return new Inflate(opts);
    Zlib$1.call(this, opts, binding.INFLATE);
  } // gzip - bigger header, same deflate compression

  function Gzip(opts) {
    if (!(this instanceof Gzip)) return new Gzip(opts);
    Zlib$1.call(this, opts, binding.GZIP);
  }
  function Gunzip(opts) {
    if (!(this instanceof Gunzip)) return new Gunzip(opts);
    Zlib$1.call(this, opts, binding.GUNZIP);
  } // raw - no header

  function DeflateRaw(opts) {
    if (!(this instanceof DeflateRaw)) return new DeflateRaw(opts);
    Zlib$1.call(this, opts, binding.DEFLATERAW);
  }
  function InflateRaw(opts) {
    if (!(this instanceof InflateRaw)) return new InflateRaw(opts);
    Zlib$1.call(this, opts, binding.INFLATERAW);
  } // auto-detect header.

  function Unzip(opts) {
    if (!(this instanceof Unzip)) return new Unzip(opts);
    Zlib$1.call(this, opts, binding.UNZIP);
  } // the Zlib class they all inherit from
  // This thing manages the queue of requests, and returns
  // true or false if there is anything in the queue when
  // you call the .write() method.

  function Zlib$1(opts, mode) {
    this._opts = opts = opts || {};
    this._chunkSize = opts.chunkSize || binding.Z_DEFAULT_CHUNK;
    Transform.call(this, opts);

    if (opts.flush) {
      if (opts.flush !== binding.Z_NO_FLUSH && opts.flush !== binding.Z_PARTIAL_FLUSH && opts.flush !== binding.Z_SYNC_FLUSH && opts.flush !== binding.Z_FULL_FLUSH && opts.flush !== binding.Z_FINISH && opts.flush !== binding.Z_BLOCK) {
        throw new Error('Invalid flush flag: ' + opts.flush);
      }
    }

    this._flushFlag = opts.flush || binding.Z_NO_FLUSH;

    if (opts.chunkSize) {
      if (opts.chunkSize < binding.Z_MIN_CHUNK || opts.chunkSize > binding.Z_MAX_CHUNK) {
        throw new Error('Invalid chunk size: ' + opts.chunkSize);
      }
    }

    if (opts.windowBits) {
      if (opts.windowBits < binding.Z_MIN_WINDOWBITS || opts.windowBits > binding.Z_MAX_WINDOWBITS) {
        throw new Error('Invalid windowBits: ' + opts.windowBits);
      }
    }

    if (opts.level) {
      if (opts.level < binding.Z_MIN_LEVEL || opts.level > binding.Z_MAX_LEVEL) {
        throw new Error('Invalid compression level: ' + opts.level);
      }
    }

    if (opts.memLevel) {
      if (opts.memLevel < binding.Z_MIN_MEMLEVEL || opts.memLevel > binding.Z_MAX_MEMLEVEL) {
        throw new Error('Invalid memLevel: ' + opts.memLevel);
      }
    }

    if (opts.strategy) {
      if (opts.strategy != binding.Z_FILTERED && opts.strategy != binding.Z_HUFFMAN_ONLY && opts.strategy != binding.Z_RLE && opts.strategy != binding.Z_FIXED && opts.strategy != binding.Z_DEFAULT_STRATEGY) {
        throw new Error('Invalid strategy: ' + opts.strategy);
      }
    }

    if (opts.dictionary) {
      if (!Buffer.isBuffer(opts.dictionary)) {
        throw new Error('Invalid dictionary: it should be a Buffer instance');
      }
    }

    this._binding = new binding.Zlib(mode);
    var self = this;
    this._hadError = false;

    this._binding.onerror = function (message, errno) {
      // there is no way to cleanly recover.
      // continuing only obscures problems.
      self._binding = null;
      self._hadError = true;
      var error = new Error(message);
      error.errno = errno;
      error.code = binding.codes[errno];
      self.emit('error', error);
    };

    var level = binding.Z_DEFAULT_COMPRESSION;
    if (typeof opts.level === 'number') level = opts.level;
    var strategy = binding.Z_DEFAULT_STRATEGY;
    if (typeof opts.strategy === 'number') strategy = opts.strategy;

    this._binding.init(opts.windowBits || binding.Z_DEFAULT_WINDOWBITS, level, opts.memLevel || binding.Z_DEFAULT_MEMLEVEL, strategy, opts.dictionary);

    this._buffer = new Buffer(this._chunkSize);
    this._offset = 0;
    this._closed = false;
    this._level = level;
    this._strategy = strategy;
    this.once('end', this.close);
  }
  inherits$1(Zlib$1, Transform);

  Zlib$1.prototype.params = function (level, strategy, callback) {
    if (level < binding.Z_MIN_LEVEL || level > binding.Z_MAX_LEVEL) {
      throw new RangeError('Invalid compression level: ' + level);
    }

    if (strategy != binding.Z_FILTERED && strategy != binding.Z_HUFFMAN_ONLY && strategy != binding.Z_RLE && strategy != binding.Z_FIXED && strategy != binding.Z_DEFAULT_STRATEGY) {
      throw new TypeError('Invalid strategy: ' + strategy);
    }

    if (this._level !== level || this._strategy !== strategy) {
      var self = this;
      this.flush(binding.Z_SYNC_FLUSH, function () {
        self._binding.params(level, strategy);

        if (!self._hadError) {
          self._level = level;
          self._strategy = strategy;
          if (callback) callback();
        }
      });
    } else {
      process.nextTick(callback);
    }
  };

  Zlib$1.prototype.reset = function () {
    return this._binding.reset();
  }; // This is the _flush function called by the transform class,
  // internally, when the last chunk has been written.


  Zlib$1.prototype._flush = function (callback) {
    this._transform(new Buffer(0), '', callback);
  };

  Zlib$1.prototype.flush = function (kind, callback) {
    var ws = this._writableState;

    if (typeof kind === 'function' || kind === void 0 && !callback) {
      callback = kind;
      kind = binding.Z_FULL_FLUSH;
    }

    if (ws.ended) {
      if (callback) process.nextTick(callback);
    } else if (ws.ending) {
      if (callback) this.once('end', callback);
    } else if (ws.needDrain) {
      var self = this;
      this.once('drain', function () {
        self.flush(callback);
      });
    } else {
      this._flushFlag = kind;
      this.write(new Buffer(0), '', callback);
    }
  };

  Zlib$1.prototype.close = function (callback) {
    if (callback) process.nextTick(callback);
    if (this._closed) return;
    this._closed = true;

    this._binding.close();

    var self = this;
    process.nextTick(function () {
      self.emit('close');
    });
  };

  Zlib$1.prototype._transform = function (chunk, encoding, cb) {
    var flushFlag;
    var ws = this._writableState;
    var ending = ws.ending || ws.ended;
    var last = ending && (!chunk || ws.length === chunk.length);
    if (!chunk === null && !Buffer.isBuffer(chunk)) return cb(new Error('invalid input')); // If it's the last chunk, or a final flush, we use the Z_FINISH flush flag.
    // If it's explicitly flushing at some other time, then we use
    // Z_FULL_FLUSH. Otherwise, use Z_NO_FLUSH for maximum compression
    // goodness.

    if (last) flushFlag = binding.Z_FINISH;else {
      flushFlag = this._flushFlag; // once we've flushed the last of the queue, stop flushing and
      // go back to the normal behavior.

      if (chunk.length >= ws.length) {
        this._flushFlag = this._opts.flush || binding.Z_NO_FLUSH;
      }
    }

    this._processChunk(chunk, flushFlag, cb);
  };

  Zlib$1.prototype._processChunk = function (chunk, flushFlag, cb) {
    var availInBefore = chunk && chunk.length;
    var availOutBefore = this._chunkSize - this._offset;
    var inOff = 0;
    var self = this;
    var async = typeof cb === 'function';

    if (!async) {
      var buffers = [];
      var nread = 0;
      var error;
      this.on('error', function (er) {
        error = er;
      });

      do {
        var res = this._binding.writeSync(flushFlag, chunk, // in
        inOff, // in_off
        availInBefore, // in_len
        this._buffer, // out
        this._offset, //out_off
        availOutBefore); // out_len

      } while (!this._hadError && callback(res[0], res[1]));

      if (this._hadError) {
        throw error;
      }

      var buf = Buffer.concat(buffers, nread);
      this.close();
      return buf;
    }

    var req = this._binding.write(flushFlag, chunk, // in
    inOff, // in_off
    availInBefore, // in_len
    this._buffer, // out
    this._offset, //out_off
    availOutBefore); // out_len


    req.buffer = chunk;
    req.callback = callback;

    function callback(availInAfter, availOutAfter) {
      if (self._hadError) return;
      var have = availOutBefore - availOutAfter;
      assert(have >= 0, 'have should not go down');

      if (have > 0) {
        var out = self._buffer.slice(self._offset, self._offset + have);

        self._offset += have; // serve some output to the consumer.

        if (async) {
          self.push(out);
        } else {
          buffers.push(out);
          nread += out.length;
        }
      } // exhausted the output buffer, or used all the input create a new one.


      if (availOutAfter === 0 || self._offset >= self._chunkSize) {
        availOutBefore = self._chunkSize;
        self._offset = 0;
        self._buffer = new Buffer(self._chunkSize);
      }

      if (availOutAfter === 0) {
        // Not actually done.  Need to reprocess.
        // Also, update the availInBefore to the availInAfter value,
        // so that if we have to hit it a third (fourth, etc.) time,
        // it'll have the correct byte counts.
        inOff += availInBefore - availInAfter;
        availInBefore = availInAfter;
        if (!async) return true;

        var newReq = self._binding.write(flushFlag, chunk, inOff, availInBefore, self._buffer, self._offset, self._chunkSize);

        newReq.callback = callback; // this same function

        newReq.buffer = chunk;
        return;
      }

      if (!async) return false; // finished with the chunk.

      cb();
    }
  };

  inherits$1(Deflate, Zlib$1);
  inherits$1(Inflate, Zlib$1);
  inherits$1(Gzip, Zlib$1);
  inherits$1(Gunzip, Zlib$1);
  inherits$1(DeflateRaw, Zlib$1);
  inherits$1(InflateRaw, Zlib$1);
  inherits$1(Unzip, Zlib$1);
  var zlib = {
    codes: codes,
    createDeflate: createDeflate,
    createInflate: createInflate,
    createDeflateRaw: createDeflateRaw,
    createInflateRaw: createInflateRaw,
    createGzip: createGzip,
    createGunzip: createGunzip,
    createUnzip: createUnzip,
    deflate: deflate$1,
    deflateSync: deflateSync,
    gzip: gzip,
    gzipSync: gzipSync,
    deflateRaw: deflateRaw,
    deflateRawSync: deflateRawSync,
    unzip: unzip,
    unzipSync: unzipSync,
    inflate: inflate$1,
    inflateSync: inflateSync,
    gunzip: gunzip,
    gunzipSync: gunzipSync,
    inflateRaw: inflateRaw,
    inflateRawSync: inflateRawSync,
    Deflate: Deflate,
    Inflate: Inflate,
    Gzip: Gzip,
    Gunzip: Gunzip,
    DeflateRaw: DeflateRaw,
    InflateRaw: InflateRaw,
    Unzip: Unzip,
    Zlib: Zlib$1
  };

  var constants = {
    BINARY_TYPES: ['nodebuffer', 'arraybuffer', 'fragments'],
    GUID: '258EAFA5-E914-47DA-95CA-C5AB0DC85B11',
    kStatusCode: Symbol('status-code'),
    kWebSocket: Symbol('websocket'),
    EMPTY_BUFFER: Buffer.alloc(0),
    NOOP: () => {}
  };

  var bufferUtil = createCommonjsModule(function (module) {

    const {
      EMPTY_BUFFER
    } = constants;
    /**
     * Merges an array of buffers into a new buffer.
     *
     * @param {Buffer[]} list The array of buffers to concat
     * @param {Number} totalLength The total length of buffers in the list
     * @return {Buffer} The resulting buffer
     * @public
     */

    function concat(list, totalLength) {
      if (list.length === 0) return EMPTY_BUFFER;
      if (list.length === 1) return list[0];
      const target = Buffer.allocUnsafe(totalLength);
      let offset = 0;

      for (let i = 0; i < list.length; i++) {
        const buf = list[i];
        buf.copy(target, offset);
        offset += buf.length;
      }

      return target;
    }
    /**
     * Masks a buffer using the given mask.
     *
     * @param {Buffer} source The buffer to mask
     * @param {Buffer} mask The mask to use
     * @param {Buffer} output The buffer where to store the result
     * @param {Number} offset The offset at which to start writing
     * @param {Number} length The number of bytes to mask.
     * @public
     */


    function _mask(source, mask, output, offset, length) {
      for (let i = 0; i < length; i++) {
        output[offset + i] = source[i] ^ mask[i & 3];
      }
    }
    /**
     * Unmasks a buffer using the given mask.
     *
     * @param {Buffer} buffer The buffer to unmask
     * @param {Buffer} mask The mask to use
     * @public
     */


    function _unmask(buffer, mask) {
      // Required until https://github.com/nodejs/node/issues/9006 is resolved.
      const length = buffer.length;

      for (let i = 0; i < length; i++) {
        buffer[i] ^= mask[i & 3];
      }
    }
    /**
     * Converts a buffer to an `ArrayBuffer`.
     *
     * @param {Buffer} buf The buffer to convert
     * @return {ArrayBuffer} Converted buffer
     * @public
     */


    function toArrayBuffer(buf) {
      if (buf.byteLength === buf.buffer.byteLength) {
        return buf.buffer;
      }

      return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
    }
    /**
     * Converts `data` to a `Buffer`.
     *
     * @param {*} data The data to convert
     * @return {Buffer} The buffer
     * @throws {TypeError}
     * @public
     */


    function toBuffer(data) {
      toBuffer.readOnly = true;
      if (Buffer.isBuffer(data)) return data;
      let buf;

      if (data instanceof ArrayBuffer) {
        buf = Buffer.from(data);
      } else if (ArrayBuffer.isView(data)) {
        buf = viewToBuffer(data);
      } else {
        buf = Buffer.from(data);
        toBuffer.readOnly = false;
      }

      return buf;
    }
    /**
     * Converts an `ArrayBuffer` view into a buffer.
     *
     * @param {(DataView|TypedArray)} view The view to convert
     * @return {Buffer} Converted view
     * @private
     */


    function viewToBuffer(view) {
      const buf = Buffer.from(view.buffer);

      if (view.byteLength !== view.buffer.byteLength) {
        return buf.slice(view.byteOffset, view.byteOffset + view.byteLength);
      }

      return buf;
    }

    try {
      const bufferUtil = bufferutil;
      const bu = bufferUtil.BufferUtil || bufferUtil;
      module.exports = {
        concat,

        mask(source, mask, output, offset, length) {
          if (length < 48) _mask(source, mask, output, offset, length);else bu.mask(source, mask, output, offset, length);
        },

        toArrayBuffer,
        toBuffer,

        unmask(buffer, mask) {
          if (buffer.length < 32) _unmask(buffer, mask);else bu.unmask(buffer, mask);
        }

      };
    } catch (e)
    /* istanbul ignore next */
    {
      module.exports = {
        concat,
        mask: _mask,
        toArrayBuffer,
        toBuffer,
        unmask: _unmask
      };
    }
  });
  var bufferUtil_1 = bufferUtil.concat;
  var bufferUtil_2 = bufferUtil.mask;
  var bufferUtil_3 = bufferUtil.toArrayBuffer;
  var bufferUtil_4 = bufferUtil.toBuffer;
  var bufferUtil_5 = bufferUtil.unmask;

  const {
    kStatusCode,
    NOOP
  } = constants;
  const TRAILER = Buffer.from([0x00, 0x00, 0xff, 0xff]);
  const EMPTY_BLOCK = Buffer.from([0x00]);
  const kPerMessageDeflate = Symbol('permessage-deflate');
  const kTotalLength = Symbol('total-length');
  const kCallback = Symbol('callback');
  const kBuffers = Symbol('buffers');
  const kError = Symbol('error'); //
  // We limit zlib concurrency, which prevents severe memory fragmentation
  // as documented in https://github.com/nodejs/node/issues/8871#issuecomment-250915913
  // and https://github.com/websockets/ws/issues/1202
  //
  // Intentionally global; it's the global thread pool that's an issue.
  //

  let zlibLimiter;
  /**
   * permessage-deflate implementation.
   */

  class PerMessageDeflate {
    /**
     * Creates a PerMessageDeflate instance.
     *
     * @param {Object} options Configuration options
     * @param {Boolean} options.serverNoContextTakeover Request/accept disabling
     *     of server context takeover
     * @param {Boolean} options.clientNoContextTakeover Advertise/acknowledge
     *     disabling of client context takeover
     * @param {(Boolean|Number)} options.serverMaxWindowBits Request/confirm the
     *     use of a custom server window size
     * @param {(Boolean|Number)} options.clientMaxWindowBits Advertise support
     *     for, or request, a custom client window size
     * @param {Object} options.zlibDeflateOptions Options to pass to zlib on deflate
     * @param {Object} options.zlibInflateOptions Options to pass to zlib on inflate
     * @param {Number} options.threshold Size (in bytes) below which messages
     *     should not be compressed
     * @param {Number} options.concurrencyLimit The number of concurrent calls to
     *     zlib
     * @param {Boolean} isServer Create the instance in either server or client
     *     mode
     * @param {Number} maxPayload The maximum allowed message length
     */
    constructor(options, isServer, maxPayload) {
      this._maxPayload = maxPayload | 0;
      this._options = options || {};
      this._threshold = this._options.threshold !== undefined ? this._options.threshold : 1024;
      this._isServer = !!isServer;
      this._deflate = null;
      this._inflate = null;
      this.params = null;

      if (!zlibLimiter) {
        const concurrency = this._options.concurrencyLimit !== undefined ? this._options.concurrencyLimit : 10;
        zlibLimiter = new asyncLimiter({
          concurrency
        });
      }
    }
    /**
     * @type {String}
     */


    static get extensionName() {
      return 'permessage-deflate';
    }
    /**
     * Create an extension negotiation offer.
     *
     * @return {Object} Extension parameters
     * @public
     */


    offer() {
      const params = {};

      if (this._options.serverNoContextTakeover) {
        params.server_no_context_takeover = true;
      }

      if (this._options.clientNoContextTakeover) {
        params.client_no_context_takeover = true;
      }

      if (this._options.serverMaxWindowBits) {
        params.server_max_window_bits = this._options.serverMaxWindowBits;
      }

      if (this._options.clientMaxWindowBits) {
        params.client_max_window_bits = this._options.clientMaxWindowBits;
      } else if (this._options.clientMaxWindowBits == null) {
        params.client_max_window_bits = true;
      }

      return params;
    }
    /**
     * Accept an extension negotiation offer/response.
     *
     * @param {Array} configurations The extension negotiation offers/reponse
     * @return {Object} Accepted configuration
     * @public
     */


    accept(configurations) {
      configurations = this.normalizeParams(configurations);
      this.params = this._isServer ? this.acceptAsServer(configurations) : this.acceptAsClient(configurations);
      return this.params;
    }
    /**
     * Releases all resources used by the extension.
     *
     * @public
     */


    cleanup() {
      if (this._inflate) {
        this._inflate.close();

        this._inflate = null;
      }

      if (this._deflate) {
        this._deflate.close();

        this._deflate = null;
      }
    }
    /**
     *  Accept an extension negotiation offer.
     *
     * @param {Array} offers The extension negotiation offers
     * @return {Object} Accepted configuration
     * @private
     */


    acceptAsServer(offers) {
      const opts = this._options;
      const accepted = offers.find(params => {
        if (opts.serverNoContextTakeover === false && params.server_no_context_takeover || params.server_max_window_bits && (opts.serverMaxWindowBits === false || typeof opts.serverMaxWindowBits === 'number' && opts.serverMaxWindowBits > params.server_max_window_bits) || typeof opts.clientMaxWindowBits === 'number' && !params.client_max_window_bits) {
          return false;
        }

        return true;
      });

      if (!accepted) {
        throw new Error('None of the extension offers can be accepted');
      }

      if (opts.serverNoContextTakeover) {
        accepted.server_no_context_takeover = true;
      }

      if (opts.clientNoContextTakeover) {
        accepted.client_no_context_takeover = true;
      }

      if (typeof opts.serverMaxWindowBits === 'number') {
        accepted.server_max_window_bits = opts.serverMaxWindowBits;
      }

      if (typeof opts.clientMaxWindowBits === 'number') {
        accepted.client_max_window_bits = opts.clientMaxWindowBits;
      } else if (accepted.client_max_window_bits === true || opts.clientMaxWindowBits === false) {
        delete accepted.client_max_window_bits;
      }

      return accepted;
    }
    /**
     * Accept the extension negotiation response.
     *
     * @param {Array} response The extension negotiation response
     * @return {Object} Accepted configuration
     * @private
     */


    acceptAsClient(response) {
      const params = response[0];

      if (this._options.clientNoContextTakeover === false && params.client_no_context_takeover) {
        throw new Error('Unexpected parameter "client_no_context_takeover"');
      }

      if (!params.client_max_window_bits) {
        if (typeof this._options.clientMaxWindowBits === 'number') {
          params.client_max_window_bits = this._options.clientMaxWindowBits;
        }
      } else if (this._options.clientMaxWindowBits === false || typeof this._options.clientMaxWindowBits === 'number' && params.client_max_window_bits > this._options.clientMaxWindowBits) {
        throw new Error('Unexpected or invalid parameter "client_max_window_bits"');
      }

      return params;
    }
    /**
     * Normalize parameters.
     *
     * @param {Array} configurations The extension negotiation offers/reponse
     * @return {Array} The offers/response with normalized parameters
     * @private
     */


    normalizeParams(configurations) {
      configurations.forEach(params => {
        Object.keys(params).forEach(key => {
          let value = params[key];

          if (value.length > 1) {
            throw new Error(`Parameter "${key}" must have only a single value`);
          }

          value = value[0];

          if (key === 'client_max_window_bits') {
            if (value !== true) {
              const num = +value;

              if (!Number.isInteger(num) || num < 8 || num > 15) {
                throw new TypeError(`Invalid value for parameter "${key}": ${value}`);
              }

              value = num;
            } else if (!this._isServer) {
              throw new TypeError(`Invalid value for parameter "${key}": ${value}`);
            }
          } else if (key === 'server_max_window_bits') {
            const num = +value;

            if (!Number.isInteger(num) || num < 8 || num > 15) {
              throw new TypeError(`Invalid value for parameter "${key}": ${value}`);
            }

            value = num;
          } else if (key === 'client_no_context_takeover' || key === 'server_no_context_takeover') {
            if (value !== true) {
              throw new TypeError(`Invalid value for parameter "${key}": ${value}`);
            }
          } else {
            throw new Error(`Unknown parameter "${key}"`);
          }

          params[key] = value;
        });
      });
      return configurations;
    }
    /**
     * Decompress data. Concurrency limited by async-limiter.
     *
     * @param {Buffer} data Compressed data
     * @param {Boolean} fin Specifies whether or not this is the last fragment
     * @param {Function} callback Callback
     * @public
     */


    decompress(data, fin, callback) {
      zlibLimiter.push(done => {
        this._decompress(data, fin, (err, result) => {
          done();
          callback(err, result);
        });
      });
    }
    /**
     * Compress data. Concurrency limited by async-limiter.
     *
     * @param {Buffer} data Data to compress
     * @param {Boolean} fin Specifies whether or not this is the last fragment
     * @param {Function} callback Callback
     * @public
     */


    compress(data, fin, callback) {
      zlibLimiter.push(done => {
        this._compress(data, fin, (err, result) => {
          done();
          callback(err, result);
        });
      });
    }
    /**
     * Decompress data.
     *
     * @param {Buffer} data Compressed data
     * @param {Boolean} fin Specifies whether or not this is the last fragment
     * @param {Function} callback Callback
     * @private
     */


    _decompress(data, fin, callback) {
      const endpoint = this._isServer ? 'client' : 'server';

      if (!this._inflate) {
        const key = `${endpoint}_max_window_bits`;
        const windowBits = typeof this.params[key] !== 'number' ? zlib.Z_DEFAULT_WINDOWBITS : this.params[key];
        this._inflate = zlib.createInflateRaw({ ...this._options.zlibInflateOptions,
          windowBits
        });
        this._inflate[kPerMessageDeflate] = this;
        this._inflate[kTotalLength] = 0;
        this._inflate[kBuffers] = [];

        this._inflate.on('error', inflateOnError);

        this._inflate.on('data', inflateOnData);
      }

      this._inflate[kCallback] = callback;

      this._inflate.write(data);

      if (fin) this._inflate.write(TRAILER);

      this._inflate.flush(() => {
        const err = this._inflate[kError];

        if (err) {
          this._inflate.close();

          this._inflate = null;
          callback(err);
          return;
        }

        const data = bufferUtil.concat(this._inflate[kBuffers], this._inflate[kTotalLength]);

        if (fin && this.params[`${endpoint}_no_context_takeover`]) {
          this._inflate.close();

          this._inflate = null;
        } else {
          this._inflate[kTotalLength] = 0;
          this._inflate[kBuffers] = [];
        }

        callback(null, data);
      });
    }
    /**
     * Compress data.
     *
     * @param {Buffer} data Data to compress
     * @param {Boolean} fin Specifies whether or not this is the last fragment
     * @param {Function} callback Callback
     * @private
     */


    _compress(data, fin, callback) {
      if (!data || data.length === 0) {
        process.nextTick(callback, null, EMPTY_BLOCK);
        return;
      }

      const endpoint = this._isServer ? 'server' : 'client';

      if (!this._deflate) {
        const key = `${endpoint}_max_window_bits`;
        const windowBits = typeof this.params[key] !== 'number' ? zlib.Z_DEFAULT_WINDOWBITS : this.params[key];
        this._deflate = zlib.createDeflateRaw({ ...this._options.zlibDeflateOptions,
          windowBits
        });
        this._deflate[kTotalLength] = 0;
        this._deflate[kBuffers] = []; //
        // An `'error'` event is emitted, only on Node.js < 10.0.0, if the
        // `zlib.DeflateRaw` instance is closed while data is being processed.
        // This can happen if `PerMessageDeflate#cleanup()` is called at the wrong
        // time due to an abnormal WebSocket closure.
        //

        this._deflate.on('error', NOOP);

        this._deflate.on('data', deflateOnData);
      }

      this._deflate.write(data);

      this._deflate.flush(zlib.Z_SYNC_FLUSH, () => {
        if (!this._deflate) {
          //
          // This `if` statement is only needed for Node.js < 10.0.0 because as of
          // commit https://github.com/nodejs/node/commit/5e3f5164, the flush
          // callback is no longer called if the deflate stream is closed while
          // data is being processed.
          //
          return;
        }

        let data = bufferUtil.concat(this._deflate[kBuffers], this._deflate[kTotalLength]);
        if (fin) data = data.slice(0, data.length - 4);

        if (fin && this.params[`${endpoint}_no_context_takeover`]) {
          this._deflate.close();

          this._deflate = null;
        } else {
          this._deflate[kTotalLength] = 0;
          this._deflate[kBuffers] = [];
        }

        callback(null, data);
      });
    }

  }

  var permessageDeflate = PerMessageDeflate;
  /**
   * The listener of the `zlib.DeflateRaw` stream `'data'` event.
   *
   * @param {Buffer} chunk A chunk of data
   * @private
   */

  function deflateOnData(chunk) {
    this[kBuffers].push(chunk);
    this[kTotalLength] += chunk.length;
  }
  /**
   * The listener of the `zlib.InflateRaw` stream `'data'` event.
   *
   * @param {Buffer} chunk A chunk of data
   * @private
   */


  function inflateOnData(chunk) {
    this[kTotalLength] += chunk.length;

    if (this[kPerMessageDeflate]._maxPayload < 1 || this[kTotalLength] <= this[kPerMessageDeflate]._maxPayload) {
      this[kBuffers].push(chunk);
      return;
    }

    this[kError] = new RangeError('Max payload size exceeded');
    this[kError][kStatusCode] = 1009;
    this.removeListener('data', inflateOnData);
    this.reset();
  }
  /**
   * The listener of the `zlib.InflateRaw` stream `'error'` event.
   *
   * @param {Error} err The emitted error
   * @private
   */


  function inflateOnError(err) {
    //
    // There is no need to call `Zlib#close()` as the handle is automatically
    // closed when an error is emitted.
    //
    this[kPerMessageDeflate]._inflate = null;
    err[kStatusCode] = 1007;
    this[kCallback](err);
  }

  var validation = createCommonjsModule(function (module, exports) {

    try {
      const isValidUTF8 = utf8Validate;
      exports.isValidUTF8 = typeof isValidUTF8 === 'object' ? isValidUTF8.Validation.isValidUTF8 // utf-8-validate@<3.0.0
      : isValidUTF8;
    } catch (e)
    /* istanbul ignore next */
    {
      exports.isValidUTF8 = () => true;
    }
    /**
     * Checks if a status code is allowed in a close frame.
     *
     * @param {Number} code The status code
     * @return {Boolean} `true` if the status code is valid, else `false`
     * @public
     */


    exports.isValidStatusCode = code => {
      return code >= 1000 && code <= 1013 && code !== 1004 && code !== 1005 && code !== 1006 || code >= 3000 && code <= 4999;
    };
  });
  var validation_1 = validation.isValidUTF8;
  var validation_2 = validation.isValidStatusCode;

  const {
    Writable: Writable$1
  } = Stream;
  const {
    BINARY_TYPES,
    EMPTY_BUFFER,
    kStatusCode: kStatusCode$1,
    kWebSocket
  } = constants;
  const {
    concat,
    toArrayBuffer: toArrayBuffer$1,
    unmask
  } = bufferUtil;
  const {
    isValidStatusCode,
    isValidUTF8
  } = validation;
  const GET_INFO = 0;
  const GET_PAYLOAD_LENGTH_16 = 1;
  const GET_PAYLOAD_LENGTH_64 = 2;
  const GET_MASK = 3;
  const GET_DATA = 4;
  const INFLATING = 5;
  /**
   * HyBi Receiver implementation.
   *
   * @extends stream.Writable
   */

  class Receiver extends Writable$1 {
    /**
     * Creates a Receiver instance.
     *
     * @param {String} binaryType The type for binary data
     * @param {Object} extensions An object containing the negotiated extensions
     * @param {Number} maxPayload The maximum allowed message length
     */
    constructor(binaryType, extensions, maxPayload) {
      super();
      this._binaryType = binaryType || BINARY_TYPES[0];
      this[kWebSocket] = undefined;
      this._extensions = extensions || {};
      this._maxPayload = maxPayload | 0;
      this._bufferedBytes = 0;
      this._buffers = [];
      this._compressed = false;
      this._payloadLength = 0;
      this._mask = undefined;
      this._fragmented = 0;
      this._masked = false;
      this._fin = false;
      this._opcode = 0;
      this._totalPayloadLength = 0;
      this._messageLength = 0;
      this._fragments = [];
      this._state = GET_INFO;
      this._loop = false;
    }
    /**
     * Implements `Writable.prototype._write()`.
     *
     * @param {Buffer} chunk The chunk of data to write
     * @param {String} encoding The character encoding of `chunk`
     * @param {Function} cb Callback
     */


    _write(chunk, encoding, cb) {
      if (this._opcode === 0x08 && this._state == GET_INFO) return cb();
      this._bufferedBytes += chunk.length;

      this._buffers.push(chunk);

      this.startLoop(cb);
    }
    /**
     * Consumes `n` bytes from the buffered data.
     *
     * @param {Number} n The number of bytes to consume
     * @return {Buffer} The consumed bytes
     * @private
     */


    consume(n) {
      this._bufferedBytes -= n;
      if (n === this._buffers[0].length) return this._buffers.shift();

      if (n < this._buffers[0].length) {
        const buf = this._buffers[0];
        this._buffers[0] = buf.slice(n);
        return buf.slice(0, n);
      }

      const dst = Buffer.allocUnsafe(n);

      do {
        const buf = this._buffers[0];

        if (n >= buf.length) {
          this._buffers.shift().copy(dst, dst.length - n);
        } else {
          buf.copy(dst, dst.length - n, 0, n);
          this._buffers[0] = buf.slice(n);
        }

        n -= buf.length;
      } while (n > 0);

      return dst;
    }
    /**
     * Starts the parsing loop.
     *
     * @param {Function} cb Callback
     * @private
     */


    startLoop(cb) {
      let err;
      this._loop = true;

      do {
        switch (this._state) {
          case GET_INFO:
            err = this.getInfo();
            break;

          case GET_PAYLOAD_LENGTH_16:
            err = this.getPayloadLength16();
            break;

          case GET_PAYLOAD_LENGTH_64:
            err = this.getPayloadLength64();
            break;

          case GET_MASK:
            this.getMask();
            break;

          case GET_DATA:
            err = this.getData(cb);
            break;

          default:
            // `INFLATING`
            this._loop = false;
            return;
        }
      } while (this._loop);

      cb(err);
    }
    /**
     * Reads the first two bytes of a frame.
     *
     * @return {(RangeError|undefined)} A possible error
     * @private
     */


    getInfo() {
      if (this._bufferedBytes < 2) {
        this._loop = false;
        return;
      }

      const buf = this.consume(2);

      if ((buf[0] & 0x30) !== 0x00) {
        this._loop = false;
        return error$1(RangeError, 'RSV2 and RSV3 must be clear', true, 1002);
      }

      const compressed = (buf[0] & 0x40) === 0x40;

      if (compressed && !this._extensions[permessageDeflate.extensionName]) {
        this._loop = false;
        return error$1(RangeError, 'RSV1 must be clear', true, 1002);
      }

      this._fin = (buf[0] & 0x80) === 0x80;
      this._opcode = buf[0] & 0x0f;
      this._payloadLength = buf[1] & 0x7f;

      if (this._opcode === 0x00) {
        if (compressed) {
          this._loop = false;
          return error$1(RangeError, 'RSV1 must be clear', true, 1002);
        }

        if (!this._fragmented) {
          this._loop = false;
          return error$1(RangeError, 'invalid opcode 0', true, 1002);
        }

        this._opcode = this._fragmented;
      } else if (this._opcode === 0x01 || this._opcode === 0x02) {
        if (this._fragmented) {
          this._loop = false;
          return error$1(RangeError, `invalid opcode ${this._opcode}`, true, 1002);
        }

        this._compressed = compressed;
      } else if (this._opcode > 0x07 && this._opcode < 0x0b) {
        if (!this._fin) {
          this._loop = false;
          return error$1(RangeError, 'FIN must be set', true, 1002);
        }

        if (compressed) {
          this._loop = false;
          return error$1(RangeError, 'RSV1 must be clear', true, 1002);
        }

        if (this._payloadLength > 0x7d) {
          this._loop = false;
          return error$1(RangeError, `invalid payload length ${this._payloadLength}`, true, 1002);
        }
      } else {
        this._loop = false;
        return error$1(RangeError, `invalid opcode ${this._opcode}`, true, 1002);
      }

      if (!this._fin && !this._fragmented) this._fragmented = this._opcode;
      this._masked = (buf[1] & 0x80) === 0x80;
      if (this._payloadLength === 126) this._state = GET_PAYLOAD_LENGTH_16;else if (this._payloadLength === 127) this._state = GET_PAYLOAD_LENGTH_64;else return this.haveLength();
    }
    /**
     * Gets extended payload length (7+16).
     *
     * @return {(RangeError|undefined)} A possible error
     * @private
     */


    getPayloadLength16() {
      if (this._bufferedBytes < 2) {
        this._loop = false;
        return;
      }

      this._payloadLength = this.consume(2).readUInt16BE(0);
      return this.haveLength();
    }
    /**
     * Gets extended payload length (7+64).
     *
     * @return {(RangeError|undefined)} A possible error
     * @private
     */


    getPayloadLength64() {
      if (this._bufferedBytes < 8) {
        this._loop = false;
        return;
      }

      const buf = this.consume(8);
      const num = buf.readUInt32BE(0); //
      // The maximum safe integer in JavaScript is 2^53 - 1. An error is returned
      // if payload length is greater than this number.
      //

      if (num > Math.pow(2, 53 - 32) - 1) {
        this._loop = false;
        return error$1(RangeError, 'Unsupported WebSocket frame: payload length > 2^53 - 1', false, 1009);
      }

      this._payloadLength = num * Math.pow(2, 32) + buf.readUInt32BE(4);
      return this.haveLength();
    }
    /**
     * Payload length has been read.
     *
     * @return {(RangeError|undefined)} A possible error
     * @private
     */


    haveLength() {
      if (this._payloadLength && this._opcode < 0x08) {
        this._totalPayloadLength += this._payloadLength;

        if (this._totalPayloadLength > this._maxPayload && this._maxPayload > 0) {
          this._loop = false;
          return error$1(RangeError, 'Max payload size exceeded', false, 1009);
        }
      }

      if (this._masked) this._state = GET_MASK;else this._state = GET_DATA;
    }
    /**
     * Reads mask bytes.
     *
     * @private
     */


    getMask() {
      if (this._bufferedBytes < 4) {
        this._loop = false;
        return;
      }

      this._mask = this.consume(4);
      this._state = GET_DATA;
    }
    /**
     * Reads data bytes.
     *
     * @param {Function} cb Callback
     * @return {(Error|RangeError|undefined)} A possible error
     * @private
     */


    getData(cb) {
      let data = EMPTY_BUFFER;

      if (this._payloadLength) {
        if (this._bufferedBytes < this._payloadLength) {
          this._loop = false;
          return;
        }

        data = this.consume(this._payloadLength);
        if (this._masked) unmask(data, this._mask);
      }

      if (this._opcode > 0x07) return this.controlMessage(data);

      if (this._compressed) {
        this._state = INFLATING;
        this.decompress(data, cb);
        return;
      }

      if (data.length) {
        //
        // This message is not compressed so its lenght is the sum of the payload
        // length of all fragments.
        //
        this._messageLength = this._totalPayloadLength;

        this._fragments.push(data);
      }

      return this.dataMessage();
    }
    /**
     * Decompresses data.
     *
     * @param {Buffer} data Compressed data
     * @param {Function} cb Callback
     * @private
     */


    decompress(data, cb) {
      const perMessageDeflate = this._extensions[permessageDeflate.extensionName];
      perMessageDeflate.decompress(data, this._fin, (err, buf) => {
        if (err) return cb(err);

        if (buf.length) {
          this._messageLength += buf.length;

          if (this._messageLength > this._maxPayload && this._maxPayload > 0) {
            return cb(error$1(RangeError, 'Max payload size exceeded', false, 1009));
          }

          this._fragments.push(buf);
        }

        const er = this.dataMessage();
        if (er) return cb(er);
        this.startLoop(cb);
      });
    }
    /**
     * Handles a data message.
     *
     * @return {(Error|undefined)} A possible error
     * @private
     */


    dataMessage() {
      if (this._fin) {
        const messageLength = this._messageLength;
        const fragments = this._fragments;
        this._totalPayloadLength = 0;
        this._messageLength = 0;
        this._fragmented = 0;
        this._fragments = [];

        if (this._opcode === 2) {
          let data;

          if (this._binaryType === 'nodebuffer') {
            data = concat(fragments, messageLength);
          } else if (this._binaryType === 'arraybuffer') {
            data = toArrayBuffer$1(concat(fragments, messageLength));
          } else {
            data = fragments;
          }

          this.emit('message', data);
        } else {
          const buf = concat(fragments, messageLength);

          if (!isValidUTF8(buf)) {
            this._loop = false;
            return error$1(Error, 'invalid UTF-8 sequence', true, 1007);
          }

          this.emit('message', buf.toString());
        }
      }

      this._state = GET_INFO;
    }
    /**
     * Handles a control message.
     *
     * @param {Buffer} data Data to handle
     * @return {(Error|RangeError|undefined)} A possible error
     * @private
     */


    controlMessage(data) {
      if (this._opcode === 0x08) {
        this._loop = false;

        if (data.length === 0) {
          this.emit('conclude', 1005, '');
          this.end();
        } else if (data.length === 1) {
          return error$1(RangeError, 'invalid payload length 1', true, 1002);
        } else {
          const code = data.readUInt16BE(0);

          if (!isValidStatusCode(code)) {
            return error$1(RangeError, `invalid status code ${code}`, true, 1002);
          }

          const buf = data.slice(2);

          if (!isValidUTF8(buf)) {
            return error$1(Error, 'invalid UTF-8 sequence', true, 1007);
          }

          this.emit('conclude', code, buf.toString());
          this.end();
        }
      } else if (this._opcode === 0x09) {
        this.emit('ping', data);
      } else {
        this.emit('pong', data);
      }

      this._state = GET_INFO;
    }

  }

  var receiver = Receiver;
  /**
   * Builds an error object.
   *
   * @param {(Error|RangeError)} ErrorCtor The error constructor
   * @param {String} message The error message
   * @param {Boolean} prefix Specifies whether or not to add a default prefix to
   *     `message`
   * @param {Number} statusCode The status code
   * @return {(Error|RangeError)} The error
   * @private
   */

  function error$1(ErrorCtor, message, prefix, statusCode) {
    const err = new ErrorCtor(prefix ? `Invalid WebSocket frame: ${message}` : message);
    Error.captureStackTrace(err, error$1);
    err[kStatusCode$1] = statusCode;
    return err;
  }

  const {
    randomFillSync
  } = require$$0$1;
  const {
    EMPTY_BUFFER: EMPTY_BUFFER$1
  } = constants;
  const {
    isValidStatusCode: isValidStatusCode$1
  } = validation;
  const {
    mask: applyMask,
    toBuffer
  } = bufferUtil;
  const mask = Buffer.alloc(4);
  /**
   * HyBi Sender implementation.
   */

  class Sender {
    /**
     * Creates a Sender instance.
     *
     * @param {net.Socket} socket The connection socket
     * @param {Object} extensions An object containing the negotiated extensions
     */
    constructor(socket, extensions) {
      this._extensions = extensions || {};
      this._socket = socket;
      this._firstFragment = true;
      this._compress = false;
      this._bufferedBytes = 0;
      this._deflating = false;
      this._queue = [];
    }
    /**
     * Frames a piece of data according to the HyBi WebSocket protocol.
     *
     * @param {Buffer} data The data to frame
     * @param {Object} options Options object
     * @param {Number} options.opcode The opcode
     * @param {Boolean} options.readOnly Specifies whether `data` can be modified
     * @param {Boolean} options.fin Specifies whether or not to set the FIN bit
     * @param {Boolean} options.mask Specifies whether or not to mask `data`
     * @param {Boolean} options.rsv1 Specifies whether or not to set the RSV1 bit
     * @return {Buffer[]} The framed data as a list of `Buffer` instances
     * @public
     */


    static frame(data, options) {
      const merge = options.mask && options.readOnly;
      let offset = options.mask ? 6 : 2;
      let payloadLength = data.length;

      if (data.length >= 65536) {
        offset += 8;
        payloadLength = 127;
      } else if (data.length > 125) {
        offset += 2;
        payloadLength = 126;
      }

      const target = Buffer.allocUnsafe(merge ? data.length + offset : offset);
      target[0] = options.fin ? options.opcode | 0x80 : options.opcode;
      if (options.rsv1) target[0] |= 0x40;
      target[1] = payloadLength;

      if (payloadLength === 126) {
        target.writeUInt16BE(data.length, 2);
      } else if (payloadLength === 127) {
        target.writeUInt32BE(0, 2);
        target.writeUInt32BE(data.length, 6);
      }

      if (!options.mask) return [target, data];
      randomFillSync(mask, 0, 4);
      target[1] |= 0x80;
      target[offset - 4] = mask[0];
      target[offset - 3] = mask[1];
      target[offset - 2] = mask[2];
      target[offset - 1] = mask[3];

      if (merge) {
        applyMask(data, mask, target, offset, data.length);
        return [target];
      }

      applyMask(data, mask, data, 0, data.length);
      return [target, data];
    }
    /**
     * Sends a close message to the other peer.
     *
     * @param {(Number|undefined)} code The status code component of the body
     * @param {String} data The message component of the body
     * @param {Boolean} mask Specifies whether or not to mask the message
     * @param {Function} cb Callback
     * @public
     */


    close(code, data, mask, cb) {
      let buf;

      if (code === undefined) {
        buf = EMPTY_BUFFER$1;
      } else if (typeof code !== 'number' || !isValidStatusCode$1(code)) {
        throw new TypeError('First argument must be a valid error code number');
      } else if (data === undefined || data === '') {
        buf = Buffer.allocUnsafe(2);
        buf.writeUInt16BE(code, 0);
      } else {
        buf = Buffer.allocUnsafe(2 + Buffer.byteLength(data));
        buf.writeUInt16BE(code, 0);
        buf.write(data, 2);
      }

      if (this._deflating) {
        this.enqueue([this.doClose, buf, mask, cb]);
      } else {
        this.doClose(buf, mask, cb);
      }
    }
    /**
     * Frames and sends a close message.
     *
     * @param {Buffer} data The message to send
     * @param {Boolean} mask Specifies whether or not to mask `data`
     * @param {Function} cb Callback
     * @private
     */


    doClose(data, mask, cb) {
      this.sendFrame(Sender.frame(data, {
        fin: true,
        rsv1: false,
        opcode: 0x08,
        mask,
        readOnly: false
      }), cb);
    }
    /**
     * Sends a ping message to the other peer.
     *
     * @param {*} data The message to send
     * @param {Boolean} mask Specifies whether or not to mask `data`
     * @param {Function} cb Callback
     * @public
     */


    ping(data, mask, cb) {
      const buf = toBuffer(data);

      if (this._deflating) {
        this.enqueue([this.doPing, buf, mask, toBuffer.readOnly, cb]);
      } else {
        this.doPing(buf, mask, toBuffer.readOnly, cb);
      }
    }
    /**
     * Frames and sends a ping message.
     *
     * @param {*} data The message to send
     * @param {Boolean} mask Specifies whether or not to mask `data`
     * @param {Boolean} readOnly Specifies whether `data` can be modified
     * @param {Function} cb Callback
     * @private
     */


    doPing(data, mask, readOnly, cb) {
      this.sendFrame(Sender.frame(data, {
        fin: true,
        rsv1: false,
        opcode: 0x09,
        mask,
        readOnly
      }), cb);
    }
    /**
     * Sends a pong message to the other peer.
     *
     * @param {*} data The message to send
     * @param {Boolean} mask Specifies whether or not to mask `data`
     * @param {Function} cb Callback
     * @public
     */


    pong(data, mask, cb) {
      const buf = toBuffer(data);

      if (this._deflating) {
        this.enqueue([this.doPong, buf, mask, toBuffer.readOnly, cb]);
      } else {
        this.doPong(buf, mask, toBuffer.readOnly, cb);
      }
    }
    /**
     * Frames and sends a pong message.
     *
     * @param {*} data The message to send
     * @param {Boolean} mask Specifies whether or not to mask `data`
     * @param {Boolean} readOnly Specifies whether `data` can be modified
     * @param {Function} cb Callback
     * @private
     */


    doPong(data, mask, readOnly, cb) {
      this.sendFrame(Sender.frame(data, {
        fin: true,
        rsv1: false,
        opcode: 0x0a,
        mask,
        readOnly
      }), cb);
    }
    /**
     * Sends a data message to the other peer.
     *
     * @param {*} data The message to send
     * @param {Object} options Options object
     * @param {Boolean} options.compress Specifies whether or not to compress `data`
     * @param {Boolean} options.binary Specifies whether `data` is binary or text
     * @param {Boolean} options.fin Specifies whether the fragment is the last one
     * @param {Boolean} options.mask Specifies whether or not to mask `data`
     * @param {Function} cb Callback
     * @public
     */


    send(data, options, cb) {
      const buf = toBuffer(data);
      const perMessageDeflate = this._extensions[permessageDeflate.extensionName];
      let opcode = options.binary ? 2 : 1;
      let rsv1 = options.compress;

      if (this._firstFragment) {
        this._firstFragment = false;

        if (rsv1 && perMessageDeflate) {
          rsv1 = buf.length >= perMessageDeflate._threshold;
        }

        this._compress = rsv1;
      } else {
        rsv1 = false;
        opcode = 0;
      }

      if (options.fin) this._firstFragment = true;

      if (perMessageDeflate) {
        const opts = {
          fin: options.fin,
          rsv1,
          opcode,
          mask: options.mask,
          readOnly: toBuffer.readOnly
        };

        if (this._deflating) {
          this.enqueue([this.dispatch, buf, this._compress, opts, cb]);
        } else {
          this.dispatch(buf, this._compress, opts, cb);
        }
      } else {
        this.sendFrame(Sender.frame(buf, {
          fin: options.fin,
          rsv1: false,
          opcode,
          mask: options.mask,
          readOnly: toBuffer.readOnly
        }), cb);
      }
    }
    /**
     * Dispatches a data message.
     *
     * @param {Buffer} data The message to send
     * @param {Boolean} compress Specifies whether or not to compress `data`
     * @param {Object} options Options object
     * @param {Number} options.opcode The opcode
     * @param {Boolean} options.readOnly Specifies whether `data` can be modified
     * @param {Boolean} options.fin Specifies whether or not to set the FIN bit
     * @param {Boolean} options.mask Specifies whether or not to mask `data`
     * @param {Boolean} options.rsv1 Specifies whether or not to set the RSV1 bit
     * @param {Function} cb Callback
     * @private
     */


    dispatch(data, compress, options, cb) {
      if (!compress) {
        this.sendFrame(Sender.frame(data, options), cb);
        return;
      }

      const perMessageDeflate = this._extensions[permessageDeflate.extensionName];
      this._deflating = true;
      perMessageDeflate.compress(data, options.fin, (_, buf) => {
        this._deflating = false;
        options.readOnly = false;
        this.sendFrame(Sender.frame(buf, options), cb);
        this.dequeue();
      });
    }
    /**
     * Executes queued send operations.
     *
     * @private
     */


    dequeue() {
      while (!this._deflating && this._queue.length) {
        const params = this._queue.shift();

        this._bufferedBytes -= params[1].length;
        Reflect.apply(params[0], this, params.slice(1));
      }
    }
    /**
     * Enqueues a send operation.
     *
     * @param {Array} params Send operation parameters.
     * @private
     */


    enqueue(params) {
      this._bufferedBytes += params[1].length;

      this._queue.push(params);
    }
    /**
     * Sends a frame.
     *
     * @param {Buffer[]} list The frame to send
     * @param {Function} cb Callback
     * @private
     */


    sendFrame(list, cb) {
      if (list.length === 2) {
        this._socket.cork();

        this._socket.write(list[0]);

        this._socket.write(list[1], cb);

        this._socket.uncork();
      } else {
        this._socket.write(list[0], cb);
      }
    }

  }

  var sender = Sender;

  /**
   * Class representing an event.
   *
   * @private
   */

  class Event {
    /**
     * Create a new `Event`.
     *
     * @param {String} type The name of the event
     * @param {Object} target A reference to the target to which the event was dispatched
     */
    constructor(type, target) {
      this.target = target;
      this.type = type;
    }

  }
  /**
   * Class representing a message event.
   *
   * @extends Event
   * @private
   */


  class MessageEvent extends Event {
    /**
     * Create a new `MessageEvent`.
     *
     * @param {(String|Buffer|ArrayBuffer|Buffer[])} data The received data
     * @param {WebSocket} target A reference to the target to which the event was dispatched
     */
    constructor(data, target) {
      super('message', target);
      this.data = data;
    }

  }
  /**
   * Class representing a close event.
   *
   * @extends Event
   * @private
   */


  class CloseEvent extends Event {
    /**
     * Create a new `CloseEvent`.
     *
     * @param {Number} code The status code explaining why the connection is being closed
     * @param {String} reason A human-readable string explaining why the connection is closing
     * @param {WebSocket} target A reference to the target to which the event was dispatched
     */
    constructor(code, reason, target) {
      super('close', target);
      this.wasClean = target._closeFrameReceived && target._closeFrameSent;
      this.reason = reason;
      this.code = code;
    }

  }
  /**
   * Class representing an open event.
   *
   * @extends Event
   * @private
   */


  class OpenEvent extends Event {
    /**
     * Create a new `OpenEvent`.
     *
     * @param {WebSocket} target A reference to the target to which the event was dispatched
     */
    constructor(target) {
      super('open', target);
    }

  }
  /**
   * Class representing an error event.
   *
   * @extends Event
   * @private
   */


  class ErrorEvent extends Event {
    /**
     * Create a new `ErrorEvent`.
     *
     * @param {Object} error The error that generated this event
     * @param {WebSocket} target A reference to the target to which the event was dispatched
     */
    constructor(error, target) {
      super('error', target);
      this.message = error.message;
      this.error = error;
    }

  }
  /**
   * This provides methods for emulating the `EventTarget` interface. It's not
   * meant to be used directly.
   *
   * @mixin
   */


  const EventTarget = {
    /**
     * Register an event listener.
     *
     * @param {String} method A string representing the event type to listen for
     * @param {Function} listener The listener to add
     * @public
     */
    addEventListener(method, listener) {
      if (typeof listener !== 'function') return;

      function onMessage(data) {
        listener.call(this, new MessageEvent(data, this));
      }

      function onClose(code, message) {
        listener.call(this, new CloseEvent(code, message, this));
      }

      function onError(error) {
        listener.call(this, new ErrorEvent(error, this));
      }

      function onOpen() {
        listener.call(this, new OpenEvent(this));
      }

      if (method === 'message') {
        onMessage._listener = listener;
        this.on(method, onMessage);
      } else if (method === 'close') {
        onClose._listener = listener;
        this.on(method, onClose);
      } else if (method === 'error') {
        onError._listener = listener;
        this.on(method, onError);
      } else if (method === 'open') {
        onOpen._listener = listener;
        this.on(method, onOpen);
      } else {
        this.on(method, listener);
      }
    },

    /**
     * Remove an event listener.
     *
     * @param {String} method A string representing the event type to remove
     * @param {Function} listener The listener to remove
     * @public
     */
    removeEventListener(method, listener) {
      const listeners = this.listeners(method);

      for (let i = 0; i < listeners.length; i++) {
        if (listeners[i] === listener || listeners[i]._listener === listener) {
          this.removeListener(method, listeners[i]);
        }
      }
    }

  };
  var eventTarget = EventTarget;

  // Allowed token characters:
  //
  // '!', '#', '$', '%', '&', ''', '*', '+', '-',
  // '.', 0-9, A-Z, '^', '_', '`', a-z, '|', '~'
  //
  // tokenChars[32] === 0 // ' '
  // tokenChars[33] === 1 // '!'
  // tokenChars[34] === 0 // '"'
  // ...
  //
  // prettier-ignore

  const tokenChars = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, // 0 - 15
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, // 16 - 31
  0, 1, 0, 1, 1, 1, 1, 1, 0, 0, 1, 1, 0, 1, 1, 0, // 32 - 47
  1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, // 48 - 63
  0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, // 64 - 79
  1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 1, 1, // 80 - 95
  1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, // 96 - 111
  1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 0 // 112 - 127
  ];
  /**
   * Adds an offer to the map of extension offers or a parameter to the map of
   * parameters.
   *
   * @param {Object} dest The map of extension offers or parameters
   * @param {String} name The extension or parameter name
   * @param {(Object|Boolean|String)} elem The extension parameters or the
   *     parameter value
   * @private
   */

  function push(dest, name, elem) {
    if (dest[name] === undefined) dest[name] = [elem];else dest[name].push(elem);
  }
  /**
   * Parses the `Sec-WebSocket-Extensions` header into an object.
   *
   * @param {String} header The field value of the header
   * @return {Object} The parsed object
   * @public
   */


  function parse$3(header) {
    const offers = Object.create(null);
    if (header === undefined || header === '') return offers;
    let params = Object.create(null);
    let mustUnescape = false;
    let isEscaping = false;
    let inQuotes = false;
    let extensionName;
    let paramName;
    let start = -1;
    let end = -1;
    let i = 0;

    for (; i < header.length; i++) {
      const code = header.charCodeAt(i);

      if (extensionName === undefined) {
        if (end === -1 && tokenChars[code] === 1) {
          if (start === -1) start = i;
        } else if (code === 0x20
        /* ' ' */
        || code === 0x09
        /* '\t' */
        ) {
            if (end === -1 && start !== -1) end = i;
          } else if (code === 0x3b
        /* ';' */
        || code === 0x2c
        /* ',' */
        ) {
            if (start === -1) {
              throw new SyntaxError(`Unexpected character at index ${i}`);
            }

            if (end === -1) end = i;
            const name = header.slice(start, end);

            if (code === 0x2c) {
              push(offers, name, params);
              params = Object.create(null);
            } else {
              extensionName = name;
            }

            start = end = -1;
          } else {
          throw new SyntaxError(`Unexpected character at index ${i}`);
        }
      } else if (paramName === undefined) {
        if (end === -1 && tokenChars[code] === 1) {
          if (start === -1) start = i;
        } else if (code === 0x20 || code === 0x09) {
          if (end === -1 && start !== -1) end = i;
        } else if (code === 0x3b || code === 0x2c) {
          if (start === -1) {
            throw new SyntaxError(`Unexpected character at index ${i}`);
          }

          if (end === -1) end = i;
          push(params, header.slice(start, end), true);

          if (code === 0x2c) {
            push(offers, extensionName, params);
            params = Object.create(null);
            extensionName = undefined;
          }

          start = end = -1;
        } else if (code === 0x3d
        /* '=' */
        && start !== -1 && end === -1) {
          paramName = header.slice(start, i);
          start = end = -1;
        } else {
          throw new SyntaxError(`Unexpected character at index ${i}`);
        }
      } else {
        //
        // The value of a quoted-string after unescaping must conform to the
        // token ABNF, so only token characters are valid.
        // Ref: https://tools.ietf.org/html/rfc6455#section-9.1
        //
        if (isEscaping) {
          if (tokenChars[code] !== 1) {
            throw new SyntaxError(`Unexpected character at index ${i}`);
          }

          if (start === -1) start = i;else if (!mustUnescape) mustUnescape = true;
          isEscaping = false;
        } else if (inQuotes) {
          if (tokenChars[code] === 1) {
            if (start === -1) start = i;
          } else if (code === 0x22
          /* '"' */
          && start !== -1) {
            inQuotes = false;
            end = i;
          } else if (code === 0x5c
          /* '\' */
          ) {
              isEscaping = true;
            } else {
            throw new SyntaxError(`Unexpected character at index ${i}`);
          }
        } else if (code === 0x22 && header.charCodeAt(i - 1) === 0x3d) {
          inQuotes = true;
        } else if (end === -1 && tokenChars[code] === 1) {
          if (start === -1) start = i;
        } else if (start !== -1 && (code === 0x20 || code === 0x09)) {
          if (end === -1) end = i;
        } else if (code === 0x3b || code === 0x2c) {
          if (start === -1) {
            throw new SyntaxError(`Unexpected character at index ${i}`);
          }

          if (end === -1) end = i;
          let value = header.slice(start, end);

          if (mustUnescape) {
            value = value.replace(/\\/g, '');
            mustUnescape = false;
          }

          push(params, paramName, value);

          if (code === 0x2c) {
            push(offers, extensionName, params);
            params = Object.create(null);
            extensionName = undefined;
          }

          paramName = undefined;
          start = end = -1;
        } else {
          throw new SyntaxError(`Unexpected character at index ${i}`);
        }
      }
    }

    if (start === -1 || inQuotes) {
      throw new SyntaxError('Unexpected end of input');
    }

    if (end === -1) end = i;
    const token = header.slice(start, end);

    if (extensionName === undefined) {
      push(offers, token, params);
    } else {
      if (paramName === undefined) {
        push(params, token, true);
      } else if (mustUnescape) {
        push(params, paramName, token.replace(/\\/g, ''));
      } else {
        push(params, paramName, token);
      }

      push(offers, extensionName, params);
    }

    return offers;
  }
  /**
   * Builds the `Sec-WebSocket-Extensions` header field value.
   *
   * @param {Object} extensions The map of extensions and parameters to format
   * @return {String} A string representing the given object
   * @public
   */


  function format$2(extensions) {
    return Object.keys(extensions).map(extension => {
      let configurations = extensions[extension];
      if (!Array.isArray(configurations)) configurations = [configurations];
      return configurations.map(params => {
        return [extension].concat(Object.keys(params).map(k => {
          let values = params[k];
          if (!Array.isArray(values)) values = [values];
          return values.map(v => v === true ? k : `${k}=${v}`).join('; ');
        })).join('; ');
      }).join(', ');
    }).join(', ');
  }

  var extension = {
    format: format$2,
    parse: parse$3
  };

  const {
    randomBytes,
    createHash
  } = require$$0$1;
  const {
    URL
  } = Url;
  const {
    BINARY_TYPES: BINARY_TYPES$1,
    EMPTY_BUFFER: EMPTY_BUFFER$2,
    GUID,
    kStatusCode: kStatusCode$2,
    kWebSocket: kWebSocket$1,
    NOOP: NOOP$1
  } = constants;
  const {
    addEventListener,
    removeEventListener
  } = eventTarget;
  const {
    format: format$3,
    parse: parse$4
  } = extension;
  const {
    toBuffer: toBuffer$1
  } = bufferUtil;
  const readyStates = ['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED'];
  const protocolVersions = [8, 13];
  const closeTimeout = 30 * 1000;
  /**
   * Class representing a WebSocket.
   *
   * @extends EventEmitter
   */

  class WebSocket extends EventEmitter {
    /**
     * Create a new `WebSocket`.
     *
     * @param {(String|url.URL)} address The URL to which to connect
     * @param {(String|String[])} protocols The subprotocols
     * @param {Object} options Connection options
     */
    constructor(address, protocols, options) {
      super();
      this.readyState = WebSocket.CONNECTING;
      this.protocol = '';
      this._binaryType = BINARY_TYPES$1[0];
      this._closeFrameReceived = false;
      this._closeFrameSent = false;
      this._closeMessage = '';
      this._closeTimer = null;
      this._closeCode = 1006;
      this._extensions = {};
      this._receiver = null;
      this._sender = null;
      this._socket = null;

      if (address !== null) {
        this._bufferedAmount = 0;
        this._isServer = false;
        this._redirects = 0;

        if (Array.isArray(protocols)) {
          protocols = protocols.join(', ');
        } else if (typeof protocols === 'object' && protocols !== null) {
          options = protocols;
          protocols = undefined;
        }

        initAsClient(this, address, protocols, options);
      } else {
        this._isServer = true;
      }
    }

    get CONNECTING() {
      return WebSocket.CONNECTING;
    }

    get CLOSING() {
      return WebSocket.CLOSING;
    }

    get CLOSED() {
      return WebSocket.CLOSED;
    }

    get OPEN() {
      return WebSocket.OPEN;
    }
    /**
     * This deviates from the WHATWG interface since ws doesn't support the
     * required default "blob" type (instead we define a custom "nodebuffer"
     * type).
     *
     * @type {String}
     */


    get binaryType() {
      return this._binaryType;
    }

    set binaryType(type) {
      if (!BINARY_TYPES$1.includes(type)) return;
      this._binaryType = type; //
      // Allow to change `binaryType` on the fly.
      //

      if (this._receiver) this._receiver._binaryType = type;
    }
    /**
     * @type {Number}
     */


    get bufferedAmount() {
      if (!this._socket) return this._bufferedAmount; //
      // `socket.bufferSize` is `undefined` if the socket is closed.
      //

      return (this._socket.bufferSize || 0) + this._sender._bufferedBytes;
    }
    /**
     * @type {String}
     */


    get extensions() {
      return Object.keys(this._extensions).join();
    }
    /**
     * Set up the socket and the internal resources.
     *
     * @param {net.Socket} socket The network socket between the server and client
     * @param {Buffer} head The first packet of the upgraded stream
     * @param {Number} maxPayload The maximum allowed message size
     * @private
     */


    setSocket(socket, head, maxPayload) {
      const receiver$1 = new receiver(this._binaryType, this._extensions, maxPayload);
      this._sender = new sender(socket, this._extensions);
      this._receiver = receiver$1;
      this._socket = socket;
      receiver$1[kWebSocket$1] = this;
      socket[kWebSocket$1] = this;
      receiver$1.on('conclude', receiverOnConclude);
      receiver$1.on('drain', receiverOnDrain);
      receiver$1.on('error', receiverOnError);
      receiver$1.on('message', receiverOnMessage);
      receiver$1.on('ping', receiverOnPing);
      receiver$1.on('pong', receiverOnPong);
      socket.setTimeout(0);
      socket.setNoDelay();
      if (head.length > 0) socket.unshift(head);
      socket.on('close', socketOnClose);
      socket.on('data', socketOnData);
      socket.on('end', socketOnEnd);
      socket.on('error', socketOnError);
      this.readyState = WebSocket.OPEN;
      this.emit('open');
    }
    /**
     * Emit the `'close'` event.
     *
     * @private
     */


    emitClose() {
      this.readyState = WebSocket.CLOSED;

      if (!this._socket) {
        this.emit('close', this._closeCode, this._closeMessage);
        return;
      }

      if (this._extensions[permessageDeflate.extensionName]) {
        this._extensions[permessageDeflate.extensionName].cleanup();
      }

      this._receiver.removeAllListeners();

      this.emit('close', this._closeCode, this._closeMessage);
    }
    /**
     * Start a closing handshake.
     *
     *          +----------+   +-----------+   +----------+
     *     - - -|ws.close()|-->|close frame|-->|ws.close()|- - -
     *    |     +----------+   +-----------+   +----------+     |
     *          +----------+   +-----------+         |
     * CLOSING  |ws.close()|<--|close frame|<--+-----+       CLOSING
     *          +----------+   +-----------+   |
     *    |           |                        |   +---+        |
     *                +------------------------+-->|fin| - - - -
     *    |         +---+                      |   +---+
     *     - - - - -|fin|<---------------------+
     *              +---+
     *
     * @param {Number} code Status code explaining why the connection is closing
     * @param {String} data A string explaining why the connection is closing
     * @public
     */


    close(code, data) {
      if (this.readyState === WebSocket.CLOSED) return;

      if (this.readyState === WebSocket.CONNECTING) {
        const msg = 'WebSocket was closed before the connection was established';
        return abortHandshake(this, this._req, msg);
      }

      if (this.readyState === WebSocket.CLOSING) {
        if (this._closeFrameSent && this._closeFrameReceived) this._socket.end();
        return;
      }

      this.readyState = WebSocket.CLOSING;

      this._sender.close(code, data, !this._isServer, err => {
        //
        // This error is handled by the `'error'` listener on the socket. We only
        // want to know if the close frame has been sent here.
        //
        if (err) return;
        this._closeFrameSent = true;
        if (this._closeFrameReceived) this._socket.end();
      }); //
      // Specify a timeout for the closing handshake to complete.
      //


      this._closeTimer = setTimeout(this._socket.destroy.bind(this._socket), closeTimeout);
    }
    /**
     * Send a ping.
     *
     * @param {*} data The data to send
     * @param {Boolean} mask Indicates whether or not to mask `data`
     * @param {Function} cb Callback which is executed when the ping is sent
     * @public
     */


    ping(data, mask, cb) {
      if (this.readyState === WebSocket.CONNECTING) {
        throw new Error('WebSocket is not open: readyState 0 (CONNECTING)');
      }

      if (typeof data === 'function') {
        cb = data;
        data = mask = undefined;
      } else if (typeof mask === 'function') {
        cb = mask;
        mask = undefined;
      }

      if (typeof data === 'number') data = data.toString();

      if (this.readyState !== WebSocket.OPEN) {
        sendAfterClose(this, data, cb);
        return;
      }

      if (mask === undefined) mask = !this._isServer;

      this._sender.ping(data || EMPTY_BUFFER$2, mask, cb);
    }
    /**
     * Send a pong.
     *
     * @param {*} data The data to send
     * @param {Boolean} mask Indicates whether or not to mask `data`
     * @param {Function} cb Callback which is executed when the pong is sent
     * @public
     */


    pong(data, mask, cb) {
      if (this.readyState === WebSocket.CONNECTING) {
        throw new Error('WebSocket is not open: readyState 0 (CONNECTING)');
      }

      if (typeof data === 'function') {
        cb = data;
        data = mask = undefined;
      } else if (typeof mask === 'function') {
        cb = mask;
        mask = undefined;
      }

      if (typeof data === 'number') data = data.toString();

      if (this.readyState !== WebSocket.OPEN) {
        sendAfterClose(this, data, cb);
        return;
      }

      if (mask === undefined) mask = !this._isServer;

      this._sender.pong(data || EMPTY_BUFFER$2, mask, cb);
    }
    /**
     * Send a data message.
     *
     * @param {*} data The message to send
     * @param {Object} options Options object
     * @param {Boolean} options.compress Specifies whether or not to compress
     *     `data`
     * @param {Boolean} options.binary Specifies whether `data` is binary or text
     * @param {Boolean} options.fin Specifies whether the fragment is the last one
     * @param {Boolean} options.mask Specifies whether or not to mask `data`
     * @param {Function} cb Callback which is executed when data is written out
     * @public
     */


    send(data, options, cb) {
      if (this.readyState === WebSocket.CONNECTING) {
        throw new Error('WebSocket is not open: readyState 0 (CONNECTING)');
      }

      if (typeof options === 'function') {
        cb = options;
        options = {};
      }

      if (typeof data === 'number') data = data.toString();

      if (this.readyState !== WebSocket.OPEN) {
        sendAfterClose(this, data, cb);
        return;
      }

      const opts = {
        binary: typeof data !== 'string',
        mask: !this._isServer,
        compress: true,
        fin: true,
        ...options
      };

      if (!this._extensions[permessageDeflate.extensionName]) {
        opts.compress = false;
      }

      this._sender.send(data || EMPTY_BUFFER$2, opts, cb);
    }
    /**
     * Forcibly close the connection.
     *
     * @public
     */


    terminate() {
      if (this.readyState === WebSocket.CLOSED) return;

      if (this.readyState === WebSocket.CONNECTING) {
        const msg = 'WebSocket was closed before the connection was established';
        return abortHandshake(this, this._req, msg);
      }

      if (this._socket) {
        this.readyState = WebSocket.CLOSING;

        this._socket.destroy();
      }
    }

  }

  readyStates.forEach((readyState, i) => {
    WebSocket[readyState] = i;
  }); //
  // Add the `onopen`, `onerror`, `onclose`, and `onmessage` attributes.
  // See https://html.spec.whatwg.org/multipage/comms.html#the-websocket-interface
  //

  ['open', 'error', 'close', 'message'].forEach(method => {
    Object.defineProperty(WebSocket.prototype, `on${method}`, {
      /**
       * Return the listener of the event.
       *
       * @return {(Function|undefined)} The event listener or `undefined`
       * @public
       */
      get() {
        const listeners = this.listeners(method);

        for (let i = 0; i < listeners.length; i++) {
          if (listeners[i]._listener) return listeners[i]._listener;
        }

        return undefined;
      },

      /**
       * Add a listener for the event.
       *
       * @param {Function} listener The listener to add
       * @public
       */
      set(listener) {
        const listeners = this.listeners(method);

        for (let i = 0; i < listeners.length; i++) {
          //
          // Remove only the listeners added via `addEventListener`.
          //
          if (listeners[i]._listener) this.removeListener(method, listeners[i]);
        }

        this.addEventListener(method, listener);
      }

    });
  });
  WebSocket.prototype.addEventListener = addEventListener;
  WebSocket.prototype.removeEventListener = removeEventListener;
  var websocket = WebSocket;
  /**
   * Initialize a WebSocket client.
   *
   * @param {WebSocket} websocket The client to initialize
   * @param {(String|url.URL)} address The URL to which to connect
   * @param {String} protocols The subprotocols
   * @param {Object} options Connection options
   * @param {(Boolean|Object)} options.perMessageDeflate Enable/disable
   *     permessage-deflate
   * @param {Number} options.handshakeTimeout Timeout in milliseconds for the
   *     handshake request
   * @param {Number} options.protocolVersion Value of the `Sec-WebSocket-Version`
   *     header
   * @param {String} options.origin Value of the `Origin` or
   *     `Sec-WebSocket-Origin` header
   * @param {Number} options.maxPayload The maximum allowed message size
   * @param {Boolean} options.followRedirects Whether or not to follow redirects
   * @param {Number} options.maxRedirects The maximum number of redirects allowed
   * @private
   */

  function initAsClient(websocket, address, protocols, options) {
    const opts = {
      protocolVersion: protocolVersions[1],
      maxPayload: 100 * 1024 * 1024,
      perMessageDeflate: true,
      followRedirects: false,
      maxRedirects: 10,
      ...options,
      createConnection: undefined,
      socketPath: undefined,
      hostname: undefined,
      protocol: undefined,
      timeout: undefined,
      method: undefined,
      auth: undefined,
      host: undefined,
      path: undefined,
      port: undefined
    };

    if (!protocolVersions.includes(opts.protocolVersion)) {
      throw new RangeError(`Unsupported protocol version: ${opts.protocolVersion} ` + `(supported versions: ${protocolVersions.join(', ')})`);
    }

    let parsedUrl;

    if (address instanceof URL) {
      parsedUrl = address;
      websocket.url = address.href;
    } else {
      parsedUrl = new URL(address);
      websocket.url = address;
    }

    const isUnixSocket = parsedUrl.protocol === 'ws+unix:';

    if (!parsedUrl.host && (!isUnixSocket || !parsedUrl.pathname)) {
      throw new Error(`Invalid URL: ${websocket.url}`);
    }

    const isSecure = parsedUrl.protocol === 'wss:' || parsedUrl.protocol === 'https:';
    const defaultPort = isSecure ? 443 : 80;
    const key = randomBytes(16).toString('base64');
    const get = isSecure ? http.get : http.get;
    let perMessageDeflate;
    opts.createConnection = isSecure ? tlsConnect : netConnect;
    opts.defaultPort = opts.defaultPort || defaultPort;
    opts.port = parsedUrl.port || defaultPort;
    opts.host = parsedUrl.hostname.startsWith('[') ? parsedUrl.hostname.slice(1, -1) : parsedUrl.hostname;
    opts.headers = {
      'Sec-WebSocket-Version': opts.protocolVersion,
      'Sec-WebSocket-Key': key,
      Connection: 'Upgrade',
      Upgrade: 'websocket',
      ...opts.headers
    };
    opts.path = parsedUrl.pathname + parsedUrl.search;
    opts.timeout = opts.handshakeTimeout;

    if (opts.perMessageDeflate) {
      perMessageDeflate = new permessageDeflate(opts.perMessageDeflate !== true ? opts.perMessageDeflate : {}, false, opts.maxPayload);
      opts.headers['Sec-WebSocket-Extensions'] = format$3({
        [permessageDeflate.extensionName]: perMessageDeflate.offer()
      });
    }

    if (protocols) {
      opts.headers['Sec-WebSocket-Protocol'] = protocols;
    }

    if (opts.origin) {
      if (opts.protocolVersion < 13) {
        opts.headers['Sec-WebSocket-Origin'] = opts.origin;
      } else {
        opts.headers.Origin = opts.origin;
      }
    }

    if (parsedUrl.username || parsedUrl.password) {
      opts.auth = `${parsedUrl.username}:${parsedUrl.password}`;
    }

    if (isUnixSocket) {
      const parts = opts.path.split(':');
      opts.socketPath = parts[0];
      opts.path = parts[1];
    }

    let req = websocket._req = get(opts);

    if (opts.timeout) {
      req.on('timeout', () => {
        abortHandshake(websocket, req, 'Opening handshake has timed out');
      });
    }

    req.on('error', err => {
      if (websocket._req.aborted) return;
      req = websocket._req = null;
      websocket.readyState = WebSocket.CLOSING;
      websocket.emit('error', err);
      websocket.emitClose();
    });
    req.on('response', res => {
      const location = res.headers.location;
      const statusCode = res.statusCode;

      if (location && opts.followRedirects && statusCode >= 300 && statusCode < 400) {
        if (++websocket._redirects > opts.maxRedirects) {
          abortHandshake(websocket, req, 'Maximum redirects exceeded');
          return;
        }

        req.abort();
        const addr = new URL(location, address);
        initAsClient(websocket, addr, protocols, options);
      } else if (!websocket.emit('unexpected-response', req, res)) {
        abortHandshake(websocket, req, `Unexpected server response: ${res.statusCode}`);
      }
    });
    req.on('upgrade', (res, socket, head) => {
      websocket.emit('upgrade', res); //
      // The user may have closed the connection from a listener of the `upgrade`
      // event.
      //

      if (websocket.readyState !== WebSocket.CONNECTING) return;
      req = websocket._req = null;
      const digest = createHash('sha1').update(key + GUID).digest('base64');

      if (res.headers['sec-websocket-accept'] !== digest) {
        abortHandshake(websocket, socket, 'Invalid Sec-WebSocket-Accept header');
        return;
      }

      const serverProt = res.headers['sec-websocket-protocol'];
      const protList = (protocols || '').split(/, */);
      let protError;

      if (!protocols && serverProt) {
        protError = 'Server sent a subprotocol but none was requested';
      } else if (protocols && !serverProt) {
        protError = 'Server sent no subprotocol';
      } else if (serverProt && !protList.includes(serverProt)) {
        protError = 'Server sent an invalid subprotocol';
      }

      if (protError) {
        abortHandshake(websocket, socket, protError);
        return;
      }

      if (serverProt) websocket.protocol = serverProt;

      if (perMessageDeflate) {
        try {
          const extensions = parse$4(res.headers['sec-websocket-extensions']);

          if (extensions[permessageDeflate.extensionName]) {
            perMessageDeflate.accept(extensions[permessageDeflate.extensionName]);
            websocket._extensions[permessageDeflate.extensionName] = perMessageDeflate;
          }
        } catch (err) {
          abortHandshake(websocket, socket, 'Invalid Sec-WebSocket-Extensions header');
          return;
        }
      }

      websocket.setSocket(socket, head, opts.maxPayload);
    });
  }
  /**
   * Create a `net.Socket` and initiate a connection.
   *
   * @param {Object} options Connection options
   * @return {net.Socket} The newly created socket used to start the connection
   * @private
   */


  function netConnect(options) {
    options.path = options.socketPath;
    return require$$0$1.connect(options);
  }
  /**
   * Create a `tls.TLSSocket` and initiate a connection.
   *
   * @param {Object} options Connection options
   * @return {tls.TLSSocket} The newly created socket used to start the connection
   * @private
   */


  function tlsConnect(options) {
    options.path = undefined;
    options.servername = options.servername || options.host;
    return require$$0$1.connect(options);
  }
  /**
   * Abort the handshake and emit an error.
   *
   * @param {WebSocket} websocket The WebSocket instance
   * @param {(http.ClientRequest|net.Socket)} stream The request to abort or the
   *     socket to destroy
   * @param {String} message The error message
   * @private
   */


  function abortHandshake(websocket, stream, message) {
    websocket.readyState = WebSocket.CLOSING;
    const err = new Error(message);
    Error.captureStackTrace(err, abortHandshake);

    if (stream.setHeader) {
      stream.abort();
      stream.once('abort', websocket.emitClose.bind(websocket));
      websocket.emit('error', err);
    } else {
      stream.destroy(err);
      stream.once('error', websocket.emit.bind(websocket, 'error'));
      stream.once('close', websocket.emitClose.bind(websocket));
    }
  }
  /**
   * Handle cases where the `ping()`, `pong()`, or `send()` methods are called
   * when the `readyState` attribute is `CLOSING` or `CLOSED`.
   *
   * @param {WebSocket} websocket The WebSocket instance
   * @param {*} data The data to send
   * @param {Function} cb Callback
   * @private
   */


  function sendAfterClose(websocket, data, cb) {
    if (data) {
      const length = toBuffer$1(data).length; //
      // The `_bufferedAmount` property is used only when the peer is a client and
      // the opening handshake fails. Under these circumstances, in fact, the
      // `setSocket()` method is not called, so the `_socket` and `_sender`
      // properties are set to `null`.
      //

      if (websocket._socket) websocket._sender._bufferedBytes += length;else websocket._bufferedAmount += length;
    }

    if (cb) {
      const err = new Error(`WebSocket is not open: readyState ${websocket.readyState} ` + `(${readyStates[websocket.readyState]})`);
      cb(err);
    }
  }
  /**
   * The listener of the `Receiver` `'conclude'` event.
   *
   * @param {Number} code The status code
   * @param {String} reason The reason for closing
   * @private
   */


  function receiverOnConclude(code, reason) {
    const websocket = this[kWebSocket$1];

    websocket._socket.removeListener('data', socketOnData);

    websocket._socket.resume();

    websocket._closeFrameReceived = true;
    websocket._closeMessage = reason;
    websocket._closeCode = code;
    if (code === 1005) websocket.close();else websocket.close(code, reason);
  }
  /**
   * The listener of the `Receiver` `'drain'` event.
   *
   * @private
   */


  function receiverOnDrain() {
    this[kWebSocket$1]._socket.resume();
  }
  /**
   * The listener of the `Receiver` `'error'` event.
   *
   * @param {(RangeError|Error)} err The emitted error
   * @private
   */


  function receiverOnError(err) {
    const websocket = this[kWebSocket$1];

    websocket._socket.removeListener('data', socketOnData);

    websocket.readyState = WebSocket.CLOSING;
    websocket._closeCode = err[kStatusCode$2];
    websocket.emit('error', err);

    websocket._socket.destroy();
  }
  /**
   * The listener of the `Receiver` `'finish'` event.
   *
   * @private
   */


  function receiverOnFinish() {
    this[kWebSocket$1].emitClose();
  }
  /**
   * The listener of the `Receiver` `'message'` event.
   *
   * @param {(String|Buffer|ArrayBuffer|Buffer[])} data The message
   * @private
   */


  function receiverOnMessage(data) {
    this[kWebSocket$1].emit('message', data);
  }
  /**
   * The listener of the `Receiver` `'ping'` event.
   *
   * @param {Buffer} data The data included in the ping frame
   * @private
   */


  function receiverOnPing(data) {
    const websocket = this[kWebSocket$1];
    websocket.pong(data, !websocket._isServer, NOOP$1);
    websocket.emit('ping', data);
  }
  /**
   * The listener of the `Receiver` `'pong'` event.
   *
   * @param {Buffer} data The data included in the pong frame
   * @private
   */


  function receiverOnPong(data) {
    this[kWebSocket$1].emit('pong', data);
  }
  /**
   * The listener of the `net.Socket` `'close'` event.
   *
   * @private
   */


  function socketOnClose() {
    const websocket = this[kWebSocket$1];
    this.removeListener('close', socketOnClose);
    this.removeListener('end', socketOnEnd);
    websocket.readyState = WebSocket.CLOSING; //
    // The close frame might not have been received or the `'end'` event emitted,
    // for example, if the socket was destroyed due to an error. Ensure that the
    // `receiver` stream is closed after writing any remaining buffered data to
    // it. If the readable side of the socket is in flowing mode then there is no
    // buffered data as everything has been already written and `readable.read()`
    // will return `null`. If instead, the socket is paused, any possible buffered
    // data will be read as a single chunk and emitted synchronously in a single
    // `'data'` event.
    //

    websocket._socket.read();

    websocket._receiver.end();

    this.removeListener('data', socketOnData);
    this[kWebSocket$1] = undefined;
    clearTimeout(websocket._closeTimer);

    if (websocket._receiver._writableState.finished || websocket._receiver._writableState.errorEmitted) {
      websocket.emitClose();
    } else {
      websocket._receiver.on('error', receiverOnFinish);

      websocket._receiver.on('finish', receiverOnFinish);
    }
  }
  /**
   * The listener of the `net.Socket` `'data'` event.
   *
   * @param {Buffer} chunk A chunk of data
   * @private
   */


  function socketOnData(chunk) {
    if (!this[kWebSocket$1]._receiver.write(chunk)) {
      this.pause();
    }
  }
  /**
   * The listener of the `net.Socket` `'end'` event.
   *
   * @private
   */


  function socketOnEnd() {
    const websocket = this[kWebSocket$1];
    websocket.readyState = WebSocket.CLOSING;

    websocket._receiver.end();

    this.end();
  }
  /**
   * The listener of the `net.Socket` `'error'` event.
   *
   * @private
   */


  function socketOnError() {
    const websocket = this[kWebSocket$1];
    this.removeListener('error', socketOnError);
    this.on('error', NOOP$1);
    websocket.readyState = WebSocket.CLOSING;
    this.destroy();
  }

  const {
    createHash: createHash$1
  } = require$$0$1;
  const {
    createServer,
    STATUS_CODES: STATUS_CODES$1
  } = http;
  const {
    format: format$4,
    parse: parse$5
  } = extension;
  const {
    GUID: GUID$1
  } = constants;
  const keyRegex = /^[+/0-9A-Za-z]{22}==$/;
  /**
   * Class representing a WebSocket server.
   *
   * @extends EventEmitter
   */

  class WebSocketServer extends EventEmitter {
    /**
     * Create a `WebSocketServer` instance.
     *
     * @param {Object} options Configuration options
     * @param {Number} options.backlog The maximum length of the queue of pending
     *     connections
     * @param {Boolean} options.clientTracking Specifies whether or not to track
     *     clients
     * @param {Function} options.handleProtocols An hook to handle protocols
     * @param {String} options.host The hostname where to bind the server
     * @param {Number} options.maxPayload The maximum allowed message size
     * @param {Boolean} options.noServer Enable no server mode
     * @param {String} options.path Accept only connections matching this path
     * @param {(Boolean|Object)} options.perMessageDeflate Enable/disable
     *     permessage-deflate
     * @param {Number} options.port The port where to bind the server
     * @param {http.Server} options.server A pre-created HTTP/S server to use
     * @param {Function} options.verifyClient An hook to reject connections
     * @param {Function} callback A listener for the `listening` event
     */
    constructor(options, callback) {
      super();
      options = {
        maxPayload: 100 * 1024 * 1024,
        perMessageDeflate: false,
        handleProtocols: null,
        clientTracking: true,
        verifyClient: null,
        noServer: false,
        backlog: null,
        // use default (511 as implemented in net.js)
        server: null,
        host: null,
        path: null,
        port: null,
        ...options
      };

      if (options.port == null && !options.server && !options.noServer) {
        throw new TypeError('One of the "port", "server", or "noServer" options must be specified');
      }

      if (options.port != null) {
        this._server = createServer((req, res) => {
          const body = STATUS_CODES$1[426];
          res.writeHead(426, {
            'Content-Length': body.length,
            'Content-Type': 'text/plain'
          });
          res.end(body);
        });

        this._server.listen(options.port, options.host, options.backlog, callback);
      } else if (options.server) {
        this._server = options.server;
      }

      if (this._server) {
        this._removeListeners = addListeners(this._server, {
          listening: this.emit.bind(this, 'listening'),
          error: this.emit.bind(this, 'error'),
          upgrade: (req, socket, head) => {
            this.handleUpgrade(req, socket, head, ws => {
              this.emit('connection', ws, req);
            });
          }
        });
      }

      if (options.perMessageDeflate === true) options.perMessageDeflate = {};
      if (options.clientTracking) this.clients = new Set();
      this.options = options;
    }
    /**
     * Returns the bound address, the address family name, and port of the server
     * as reported by the operating system if listening on an IP socket.
     * If the server is listening on a pipe or UNIX domain socket, the name is
     * returned as a string.
     *
     * @return {(Object|String|null)} The address of the server
     * @public
     */


    address() {
      if (this.options.noServer) {
        throw new Error('The server is operating in "noServer" mode');
      }

      if (!this._server) return null;
      return this._server.address();
    }
    /**
     * Close the server.
     *
     * @param {Function} cb Callback
     * @public
     */


    close(cb) {
      if (cb) this.once('close', cb); //
      // Terminate all associated clients.
      //

      if (this.clients) {
        for (const client of this.clients) client.terminate();
      }

      const server = this._server;

      if (server) {
        this._removeListeners();

        this._removeListeners = this._server = null; //
        // Close the http server if it was internally created.
        //

        if (this.options.port != null) {
          server.close(() => this.emit('close'));
          return;
        }
      }

      process.nextTick(emitClose, this);
    }
    /**
     * See if a given request should be handled by this server instance.
     *
     * @param {http.IncomingMessage} req Request object to inspect
     * @return {Boolean} `true` if the request is valid, else `false`
     * @public
     */


    shouldHandle(req) {
      if (this.options.path) {
        const index = req.url.indexOf('?');
        const pathname = index !== -1 ? req.url.slice(0, index) : req.url;
        if (pathname !== this.options.path) return false;
      }

      return true;
    }
    /**
     * Handle a HTTP Upgrade request.
     *
     * @param {http.IncomingMessage} req The request object
     * @param {net.Socket} socket The network socket between the server and client
     * @param {Buffer} head The first packet of the upgraded stream
     * @param {Function} cb Callback
     * @public
     */


    handleUpgrade(req, socket, head, cb) {
      socket.on('error', socketOnError$1);
      const key = req.headers['sec-websocket-key'] !== undefined ? req.headers['sec-websocket-key'].trim() : false;
      const version = +req.headers['sec-websocket-version'];
      const extensions = {};

      if (req.method !== 'GET' || req.headers.upgrade.toLowerCase() !== 'websocket' || !key || !keyRegex.test(key) || version !== 8 && version !== 13 || !this.shouldHandle(req)) {
        return abortHandshake$1(socket, 400);
      }

      if (this.options.perMessageDeflate) {
        const perMessageDeflate = new permessageDeflate(this.options.perMessageDeflate, true, this.options.maxPayload);

        try {
          const offers = parse$5(req.headers['sec-websocket-extensions']);

          if (offers[permessageDeflate.extensionName]) {
            perMessageDeflate.accept(offers[permessageDeflate.extensionName]);
            extensions[permessageDeflate.extensionName] = perMessageDeflate;
          }
        } catch (err) {
          return abortHandshake$1(socket, 400);
        }
      } //
      // Optionally call external client verification handler.
      //


      if (this.options.verifyClient) {
        const info = {
          origin: req.headers[`${version === 8 ? 'sec-websocket-origin' : 'origin'}`],
          secure: !!(req.connection.authorized || req.connection.encrypted),
          req
        };

        if (this.options.verifyClient.length === 2) {
          this.options.verifyClient(info, (verified, code, message, headers) => {
            if (!verified) {
              return abortHandshake$1(socket, code || 401, message, headers);
            }

            this.completeUpgrade(key, extensions, req, socket, head, cb);
          });
          return;
        }

        if (!this.options.verifyClient(info)) return abortHandshake$1(socket, 401);
      }

      this.completeUpgrade(key, extensions, req, socket, head, cb);
    }
    /**
     * Upgrade the connection to WebSocket.
     *
     * @param {String} key The value of the `Sec-WebSocket-Key` header
     * @param {Object} extensions The accepted extensions
     * @param {http.IncomingMessage} req The request object
     * @param {net.Socket} socket The network socket between the server and client
     * @param {Buffer} head The first packet of the upgraded stream
     * @param {Function} cb Callback
     * @private
     */


    completeUpgrade(key, extensions, req, socket, head, cb) {
      //
      // Destroy the socket if the client has already sent a FIN packet.
      //
      if (!socket.readable || !socket.writable) return socket.destroy();
      const digest = createHash$1('sha1').update(key + GUID$1).digest('base64');
      const headers = ['HTTP/1.1 101 Switching Protocols', 'Upgrade: websocket', 'Connection: Upgrade', `Sec-WebSocket-Accept: ${digest}`];
      const ws = new websocket(null);
      let protocol = req.headers['sec-websocket-protocol'];

      if (protocol) {
        protocol = protocol.trim().split(/ *, */); //
        // Optionally call external protocol selection handler.
        //

        if (this.options.handleProtocols) {
          protocol = this.options.handleProtocols(protocol, req);
        } else {
          protocol = protocol[0];
        }

        if (protocol) {
          headers.push(`Sec-WebSocket-Protocol: ${protocol}`);
          ws.protocol = protocol;
        }
      }

      if (extensions[permessageDeflate.extensionName]) {
        const params = extensions[permessageDeflate.extensionName].params;
        const value = format$4({
          [permessageDeflate.extensionName]: [params]
        });
        headers.push(`Sec-WebSocket-Extensions: ${value}`);
        ws._extensions = extensions;
      } //
      // Allow external modification/inspection of handshake headers.
      //


      this.emit('headers', headers, req);
      socket.write(headers.concat('\r\n').join('\r\n'));
      socket.removeListener('error', socketOnError$1);
      ws.setSocket(socket, head, this.options.maxPayload);

      if (this.clients) {
        this.clients.add(ws);
        ws.on('close', () => this.clients.delete(ws));
      }

      cb(ws);
    }

  }

  var websocketServer = WebSocketServer;
  /**
   * Add event listeners on an `EventEmitter` using a map of <event, listener>
   * pairs.
   *
   * @param {EventEmitter} server The event emitter
   * @param {Object.<String, Function>} map The listeners to add
   * @return {Function} A function that will remove the added listeners when called
   * @private
   */

  function addListeners(server, map) {
    for (const event of Object.keys(map)) server.on(event, map[event]);

    return function removeListeners() {
      for (const event of Object.keys(map)) {
        server.removeListener(event, map[event]);
      }
    };
  }
  /**
   * Emit a `'close'` event on an `EventEmitter`.
   *
   * @param {EventEmitter} server The event emitter
   * @private
   */


  function emitClose(server) {
    server.emit('close');
  }
  /**
   * Handle premature socket errors.
   *
   * @private
   */


  function socketOnError$1() {
    this.destroy();
  }
  /**
   * Close the connection when preconditions are not fulfilled.
   *
   * @param {net.Socket} socket The socket of the upgrade request
   * @param {Number} code The HTTP response status code
   * @param {String} [message] The HTTP response body
   * @param {Object} [headers] Additional HTTP response headers
   * @private
   */


  function abortHandshake$1(socket, code, message, headers) {
    if (socket.writable) {
      message = message || STATUS_CODES$1[code];
      headers = {
        Connection: 'close',
        'Content-type': 'text/html',
        'Content-Length': Buffer.byteLength(message),
        ...headers
      };
      socket.write(`HTTP/1.1 ${code} ${STATUS_CODES$1[code]}\r\n` + Object.keys(headers).map(h => `${h}: ${headers[h]}`).join('\r\n') + '\r\n\r\n' + message);
    }

    socket.removeListener('error', socketOnError$1);
    socket.destroy();
  }

  websocket.Server = websocketServer;
  websocket.Receiver = receiver;
  websocket.Sender = sender;
  var ws = websocket;

  const WebSocket$1 = commonjsGlobal.WebSocket || ws;
  const CODE = 'ECONNERROR';

  class Socket extends EventEmitter {
    constructor() {
      super();
      this.listeners = Object.create(null);
    }

    connect(url) {
      this.url = url;

      this._attachSocket(new WebSocket$1(url, ['xmpp']));
    }

    _attachSocket(socket) {
      const sock = this.socket = socket;
      const {
        listeners
      } = this;

      listeners.open = () => {
        this.emit('connect');
      };

      listeners.message = ({
        data
      }) => this.emit('data', data);

      listeners.error = event => {
        // WS
        let {
          error
        } = event; // DOM

        if (!error) {
          error = new Error(`WebSocket ${CODE} ${this.url}`);
          error.errno = CODE;
          error.code = CODE;
        }

        error.event = event;
        error.url = this.url;
        this.emit('error', error);
      };

      listeners.close = event => {
        this._detachSocket();

        this.emit('close', !event.wasClean, event);
      };

      sock.addEventListener('open', listeners.open);
      sock.addEventListener('message', listeners.message);
      sock.addEventListener('error', listeners.error);
      sock.addEventListener('close', listeners.close);
    }

    _detachSocket() {
      delete this.url;
      const {
        socket,
        listeners
      } = this;
      Object.getOwnPropertyNames(listeners).forEach(k => {
        socket.removeEventListener(k, listeners[k]);
        delete listeners[k];
      });
      delete this.socket;
    }

    end() {
      this.socket.close();
    }

    write(data, fn) {
      if (WebSocket$1 === ws) {
        this.socket.send(data, fn);
      } else {
        this.socket.send(data);
        fn();
      }
    }

  }

  var Socket_1 = Socket;

  const {
    Parser: Parser$1,
    Element: Element$2,
    XMLError: XMLError$1
  } = esm$2;
  var FramedParser_1 = class FramedParser extends Parser$1 {
    onStartElement(name, attrs) {
      const element = new Element$2(name, attrs);
      const {
        cursor
      } = this;

      if (cursor) {
        cursor.append(element);
      }

      this.cursor = element;
    }

    onEndElement(name) {
      const {
        cursor
      } = this;

      if (name !== cursor.name) {
        // <foo></bar>
        this.emit('error', new XMLError$1(`${cursor.name} must be closed.`));
        return;
      }

      if (cursor.parent) {
        this.cursor = cursor.parent;
        return;
      }

      if (cursor.is('open', 'urn:ietf:params:xml:ns:xmpp-framing')) {
        this.emit('start', cursor);
      } else if (cursor.is('close', 'urn:ietf:params:xml:ns:xmpp-framing')) {
        this.emit('end', cursor);
      } else {
        this.emit('element', cursor);
      }

      this.cursor = null;
    }

  };

  const NS_FRAMING = 'urn:ietf:params:xml:ns:xmpp-framing';
  /* References
   * WebSocket protocol https://tools.ietf.org/html/rfc6455
   * WebSocket Web API https://html.spec.whatwg.org/multipage/comms.html#network
   * XMPP over WebSocket https://tools.ietf.org/html/rfc7395
   */

  class ConnectionWebSocket extends esm$4 {
    // https://tools.ietf.org/html/rfc7395#section-3.6
    footerElement() {
      return new esm$2.Element('close', {
        xmlns: NS_FRAMING
      });
    } // https://tools.ietf.org/html/rfc7395#section-3.4


    headerElement() {
      const el = super.headerElement();
      el.name = 'open';
      el.attrs.xmlns = NS_FRAMING;
      return el;
    }

    socketParameters(service) {
      return service.match(/^wss?:\/\//) ? service : undefined;
    }

  }

  ConnectionWebSocket.prototype.Socket = Socket_1;
  ConnectionWebSocket.prototype.NS = 'jabber:client';
  ConnectionWebSocket.prototype.Parser = FramedParser_1;
  var Connection_1 = ConnectionWebSocket;

  var esm$7 = function websocket({
    entity
  }) {
    entity.transports.push(Connection_1);
  };

  const {
    Socket: Socket$1
  } = require$$0$1;
  const {
    Parser: Parser$2
  } = esm$2;
  const {
    URL: URL$1
  } = Url;
  const NS_STREAM$1 = 'http://etherx.jabber.org/streams';
  /* References
   * Extensible Messaging and Presence Protocol (XMPP): Core http://xmpp.org/rfcs/rfc6120.html
   */

  class ConnectionTCP extends esm$4 {
    socketParameters(service) {
      const {
        port,
        hostname,
        protocol
      } = new URL$1(service);
      return protocol === 'xmpp:' ? {
        port: port ? Number(port) : null,
        host: hostname
      } : undefined;
    } // https://xmpp.org/rfcs/rfc6120.html#streams-open


    headerElement() {
      const el = super.headerElement();
      el.name = 'stream:stream';
      el.attrs['xmlns:stream'] = NS_STREAM$1;
      return el;
    } // https://xmpp.org/rfcs/rfc6120.html#streams-open


    header(el) {
      const frag = el.toString();
      return `<?xml version='1.0'?>` + frag.substr(0, frag.length - 2) + '>';
    } // https://xmpp.org/rfcs/rfc6120.html#streams-close


    footer() {
      return '</stream:stream>';
    }

  }

  ConnectionTCP.prototype.NS = NS_STREAM$1;
  ConnectionTCP.prototype.Socket = Socket$1;
  ConnectionTCP.prototype.Parser = Parser$2;
  var esm$8 = ConnectionTCP;

  class ConnectionTCP$1 extends esm$8 {
    socketParameters(service) {
      const params = super.socketParameters(service);
      if (!params) return params;
      params.port = params.port || 5222;
      return params;
    }

  }

  ConnectionTCP$1.prototype.NS = 'jabber:client';
  var Connection_1$1 = ConnectionTCP$1;

  var esm$9 = function tcp({
    entity
  }) {
    entity.transports.push(Connection_1$1);
  };

  const {
    URL: URL$2
  } = Url;

  class ConnectionTLS extends esm$8 {
    socketParameters(service) {
      const {
        port,
        hostname,
        protocol
      } = new URL$2(service);
      return protocol === 'xmpps:' ? {
        port: Number(port) || 5223,
        host: hostname
      } : undefined;
    }

  }

  ConnectionTLS.prototype.Socket = require$$0$1.TLSSocket;
  ConnectionTLS.prototype.NS = 'jabber:client';
  var Connection$1 = ConnectionTLS;

  var esm$a = function tls({
    entity
  }) {
    entity.transports.push(Connection$1);
  };

  /**
   * Expose compositor.
   */

  var koaCompose = compose;
  /**
   * Compose `middleware` returning
   * a fully valid middleware comprised
   * of all those which are passed.
   *
   * @param {Array} middleware
   * @return {Function}
   * @api public
   */

  function compose(middleware) {
    if (!Array.isArray(middleware)) throw new TypeError('Middleware stack must be an array!');

    for (const fn of middleware) {
      if (typeof fn !== 'function') throw new TypeError('Middleware must be composed of functions!');
    }
    /**
     * @param {Object} context
     * @return {Promise}
     * @api public
     */


    return function (context, next) {
      // last called middleware #
      let index = -1;
      return dispatch(0);

      function dispatch(i) {
        if (i <= index) return Promise.reject(new Error('next() called multiple times'));
        index = i;
        let fn = middleware[i];
        if (i === middleware.length) fn = next;
        if (!fn) return Promise.resolve();

        try {
          return Promise.resolve(fn(context, dispatch.bind(null, i + 1)));
        } catch (err) {
          return Promise.reject(err);
        }
      }
    };
  }

  var Context_1 = class Context {
    constructor(entity, stanza) {
      this.stanza = stanza;
      this.entity = entity;
      const {
        name,
        attrs
      } = stanza;
      const {
        type,
        id
      } = attrs;
      this.name = name;
      this.id = id || '';

      if (name === 'message') {
        this.type = type || 'normal';
      } else if (name === 'presence') {
        this.type = type || 'available';
      } else {
        this.type = type || '';
      }

      this.from = null;
      this.to = null;
      this.local = '';
      this.domain = '';
      this.resource = '';
    }

  };

  var IncomingContext_1 = class IncomingContext extends Context_1 {
    constructor(entity, stanza) {
      super(entity, stanza);
      const {
        jid,
        domain
      } = entity;
      const to = stanza.attrs.to || jid && jid.toString();
      const from = stanza.attrs.from || domain;
      if (to) this.to = new esm$1(to);

      if (from) {
        this.from = new esm$1(from);
        this.local = this.from.local;
        this.domain = this.from.domain;
        this.resource = this.from.resource;
      }
    }

  };

  var OutgoingContext_1 = class OutgoingContext extends Context_1 {
    constructor(entity, stanza) {
      super(entity, stanza);
      const {
        jid,
        domain
      } = entity;
      const from = stanza.attrs.from || jid && jid.toString();
      const to = stanza.attrs.to || domain;
      if (from) this.from = new esm$1(from);

      if (to) {
        this.to = new esm$1(to);
        this.local = this.to.local;
        this.domain = this.to.domain;
        this.resource = this.to.resource;
      }
    }

  };

  function listener(entity, middleware, Context) {
    return function (stanza) {
      const ctx = new Context(entity, stanza);
      return koaCompose(middleware)(ctx);
    };
  }

  function errorHandler(entity) {
    return function (ctx, next) {
      next().then(reply => reply && entity.send(reply)).catch(err => entity.emit('error', err));
    };
  }

  var esm$b = function ({
    entity
  }) {
    const incoming = [errorHandler(entity)];
    const outgoing = [];
    const incomingListener = listener(entity, incoming, IncomingContext_1);
    const outgoingListener = listener(entity, outgoing, OutgoingContext_1);
    entity.on('element', incomingListener);
    entity.hookOutgoing = outgoingListener;
    return {
      use(fn) {
        incoming.push(fn);
        return fn;
      },

      filter(fn) {
        outgoing.push(fn);
        return fn;
      }

    };
  };

  var route = function route() {
    return async function ({
      stanza,
      entity
    }, next) {
      if (!stanza.is('features', 'http://etherx.jabber.org/streams')) return next();
      await next();
      if (entity.jid) entity._status('online', entity.jid);
    };
  };

  /**
   * References
   * https://xmpp.org/rfcs/rfc6120.html#streams-negotiation Stream Negotiation
   * https://xmpp.org/extensions/xep-0170.html XEP-0170: Recommended Order of Stream Feature Negotiation
   * https://xmpp.org/registrar/stream-features.html XML Stream Features
   */

  var esm$c = function ({
    middleware
  }) {
    middleware.use(route());

    function use(name, xmlns, handler) {
      return middleware.use((ctx, next) => {
        const {
          stanza
        } = ctx;
        if (!stanza.is('features', 'http://etherx.jabber.org/streams')) return next();
        const feature = stanza.getChild(name, xmlns);
        if (!feature) return next();
        return handler(ctx, next, feature);
      });
    }

    return {
      use
    };
  };

  /**
   * References
   * https://xmpp.org/rfcs/rfc6120.html#stanzas-semantics-iq
   * https://xmpp.org/rfcs/rfc6120.html#stanzas-error
   */

  const NS_STANZA = 'urn:ietf:params:xml:ns:xmpp-stanzas';

  function isQuery({
    name,
    type
  }) {
    if (name !== 'iq') return false;
    if (type === 'error' || type === 'result') return false;
    return true;
  }

  function isValidQuery({
    type
  }, children, child) {
    if (type !== 'get' && type !== 'set') return false;
    if (children.length !== 1) return false;
    if (!child) return false;
    return true;
  }

  function buildReply({
    stanza
  }) {
    return esm$2('iq', {
      to: stanza.attrs.from,
      from: stanza.attrs.to,
      id: stanza.attrs.id
    });
  }

  function buildReplyResult(ctx, child) {
    const reply = buildReply(ctx);
    reply.attrs.type = 'result';

    if (child) {
      reply.append(child);
    }

    return reply;
  }

  function buildReplyError(ctx, error, child) {
    const reply = buildReply(ctx);
    reply.attrs.type = 'error';

    if (child) {
      reply.append(child);
    }

    reply.append(error);
    return reply;
  }

  function buildError(type, condition) {
    return esm$2('error', {
      type
    }, esm$2(condition, NS_STANZA));
  }

  function iqHandler(entity) {
    return async function iqHandler(ctx, next) {
      if (!isQuery(ctx)) return next();
      const {
        stanza
      } = ctx;
      const children = stanza.getChildElements();
      const [child] = children;

      if (!isValidQuery(ctx, children, child)) {
        return buildReplyError(ctx, buildError('modify', 'bad-request'), child);
      }

      ctx.element = child;
      let reply;

      try {
        reply = await next();
      } catch (err) {
        entity.emit('error', err);
        reply = buildError('cancel', 'internal-server-error');
      }

      if (!reply) {
        reply = buildError('cancel', 'service-unavailable');
      }

      if (reply instanceof esm$2.Element && reply.is('error')) {
        return buildReplyError(ctx, reply, child);
      }

      return buildReplyResult(ctx, reply instanceof esm$2.Element ? reply : undefined);
    };
  }

  function route$1(type, ns, name, handler) {
    return function (ctx, next) {
      if (ctx.type !== type | !ctx.element || !ctx.element.is(name, ns)) return next();
      return handler(ctx, next);
    };
  }

  var callee = function ({
    middleware,
    entity
  }) {
    middleware.use(iqHandler(entity));
    return {
      get(ns, name, handler) {
        middleware.use(route$1('get', ns, name, handler));
      },

      set(ns, name, handler) {
        middleware.use(route$1('set', ns, name, handler));
      }

    };
  };

  var esm$d = function id() {
    let i;

    while (!i) {
      i = Math.random().toString(36).substr(2, 12);
    }

    return i;
  };

  /* https://xmpp.org/rfcs/rfc6120.html#stanzas-error */


  class StanzaError extends esm$3 {
    constructor(condition, text, application, type) {
      super(condition, text, application);
      this.type = type;
      this.name = 'StanzaError';
    }

    static fromElement(element) {
      const error = super.fromElement(element);
      error.type = element.attrs.type;
      return error;
    }

  }

  var StanzaError_1 = StanzaError;

  const {
    Deferred: Deferred$1
  } = esm;
  const timeoutPromise = esm.timeout;

  function isReply({
    name,
    type
  }) {
    if (name !== 'iq') return false;
    if (type !== 'error' && type !== 'result') return false;
    return true;
  }

  var caller = function iqCaller({
    entity,
    middleware
  }) {
    const handlers = new Map();
    middleware.use(({
      type,
      name,
      id,
      stanza
    }, next) => {
      if (!isReply({
        name,
        type
      })) return next();
      const deferred = handlers.get(id);

      if (!deferred) {
        return next();
      }

      if (type === 'error') {
        deferred.reject(StanzaError_1.fromElement(stanza.getChild('error')));
      } else {
        deferred.resolve(stanza);
      }

      handlers.delete(id);
    });
    return {
      handlers,

      async request(stanza, timeout = 30 * 1000) {
        if (!stanza.attrs.id) {
          stanza.attrs.id = esm$d();
        }

        const deferred = new Deferred$1();
        handlers.set(stanza.attrs.id, deferred);

        try {
          await entity.send(stanza);
          await timeoutPromise(deferred.promise, timeout);
        } catch (err) {
          handlers.delete(stanza.attrs.id);
          throw err;
        }

        return deferred.promise;
      }

    };
  };

  var esm$e = {
    iqCallee: callee,
    iqCaller: caller
  };

  function isSecure(uri) {
    return uri.startsWith('https') || uri.startsWith('wss');
  }

  var compare = function compare(a, b) {
    let secure;

    if (isSecure(a.uri) && !isSecure(b.uri)) {
      secure = -1;
    } else if (!isSecure(a.uri) && isSecure(b.uri)) {
      secure = 1;
    } else {
      secure = 0;
    }

    if (secure !== 0) {
      return secure;
    }

    let method;

    if (a.method === b.method) {
      method = 0;
    } else if (a.method === 'websocket') {
      method = -1;
    } else if (b.method === 'websocket') {
      method = 1;
    } else if (a.method === 'xbosh') {
      method = -1;
    } else if (b.method === 'xbosh') {
      method = 1;
    } else if (a.method === 'httppoll') {
      method = -1;
    } else if (b.method === 'httppoll') {
      method = 1;
    } else {
      method = 0;
    }

    if (method !== 0) {
      return method;
    }

    return 0;
  };

  var altConnections = {
    compare: compare
  };

  const compareAltConnections = altConnections.compare;

  function lookup$1(domain, options = {}) {
    options.all = true;
    return new Promise((resolve, reject) => {
      require$$0$1.lookup(domain, options, (err, addresses) => {
        if (err) {
          return reject(err);
        }

        const result = [];
        addresses.forEach(({
          family,
          address
        }) => {
          const uri = `://${family === 4 ? address : '[' + address + ']'}:`;
          result.push({
            family,
            address,
            uri: 'xmpps' + uri + '5223'
          }, {
            family,
            address,
            uri: 'xmpp' + uri + '5222'
          });
        });
        resolve(result);
      });
    });
  }

  function resolveTxt(domain, {
    owner = '_xmppconnect'
  }) {
    return new Promise((resolve, reject) => {
      require$$0$1.resolveTxt(`${owner}.${domain}`, (err, records) => {
        if (err && err.code === 'ENOTFOUND') {
          resolve([]);
        } else if (err) {
          reject(err);
        } else {
          resolve(records.map(record => {
            const [attribute, value] = record[0].split('=');
            return {
              attribute,
              value,
              method: attribute.split('-').pop(),
              uri: value
            };
          }).sort(compareAltConnections));
        }
      });
    });
  }

  function resolveSrv(domain, {
    service,
    protocol
  }) {
    return new Promise((resolve, reject) => {
      require$$0$1.resolveSrv(`_${service}._${protocol}.${domain}`, (err, records) => {
        if (err && err.code === 'ENOTFOUND') {
          resolve([]);
        } else if (err) {
          reject(err);
        } else {
          resolve(records.map(record => {
            return Object.assign(record, {
              service,
              protocol
            });
          }));
        }
      });
    });
  }

  function sortSrv(records) {
    return records.sort((a, b) => {
      const priority = a.priority - b.priority;

      if (priority !== 0) {
        return priority;
      }

      const weight = b.weight - a.weight;

      if (weight !== 0) {
        return weight;
      }

      return 0;
    });
  }

  function lookupSrvs(srvs, options) {
    const addresses = [];
    return Promise.all(srvs.map(async srv => {
      const srvAddresses = await lookup$1(srv.name, options);
      srvAddresses.forEach(address => {
        const {
          port,
          service
        } = srv;
        const addr = address.address;
        addresses.push(Object.assign({}, address, srv, {
          uri: `${service.split('-')[0]}://${address.family === 6 ? '[' + addr + ']' : addr}:${port}`
        }));
      });
    })).then(() => addresses);
  }

  function resolve(domain, options = {}) {
    if (!options.srv) {
      options.srv = [{
        service: 'xmpps-client',
        protocol: 'tcp'
      }, {
        service: 'xmpp-client',
        protocol: 'tcp'
      }, {
        service: 'xmpps-server',
        protocol: 'tcp'
      }, {
        service: 'xmpp-server',
        protocol: 'tcp'
      }, {
        service: 'stun',
        protocol: 'tcp'
      }, {
        service: 'stun',
        protocol: 'udp'
      }, {
        service: 'stuns ',
        protcol: 'tcp'
      }, {
        service: 'turn',
        protocol: 'tcp'
      }, {
        service: 'turn',
        protocol: 'udp'
      }, {
        service: 'turns',
        protcol: 'tcp'
      }];
    }

    const family = {
      options
    };
    return lookup$1(domain, options).then(addresses => {
      return Promise.all(options.srv.map(srv => {
        return resolveSrv(domain, Object.assign({}, srv, {
          family
        })).then(records => {
          return lookupSrvs(records, options);
        });
      })).then(srvs => sortSrv([].concat(...srvs)).concat(addresses)).then(records => {
        return resolveTxt(domain, options).then(txtRecords => {
          return records.concat(txtRecords);
        });
      });
    });
  }

  var lookup_1 = lookup$1;
  var resolveSrv_1 = resolveSrv;
  var lookupSrvs_1 = lookupSrvs;
  var resolve_1 = resolve;
  var sortSrv_1 = sortSrv;
  var dns_1 = {
    lookup: lookup_1,
    resolveSrv: resolveSrv_1,
    lookupSrvs: lookupSrvs_1,
    resolve: resolve_1,
    sortSrv: sortSrv_1
  };

  // fix for "Readable" isn't a named export issue

  const Readable$1 = Stream.Readable;
  const BUFFER = Symbol('buffer');
  const TYPE$2 = Symbol('type');

  class Blob {
    constructor() {
      this[TYPE$2] = '';
      const blobParts = arguments[0];
      const options = arguments[1];
      const buffers = [];
      let size = 0;

      if (blobParts) {
        const a = blobParts;
        const length = Number(a.length);

        for (let i = 0; i < length; i++) {
          const element = a[i];
          let buffer;

          if (element instanceof Buffer) {
            buffer = element;
          } else if (ArrayBuffer.isView(element)) {
            buffer = Buffer.from(element.buffer, element.byteOffset, element.byteLength);
          } else if (element instanceof ArrayBuffer) {
            buffer = Buffer.from(element);
          } else if (element instanceof Blob) {
            buffer = element[BUFFER];
          } else {
            buffer = Buffer.from(typeof element === 'string' ? element : String(element));
          }

          size += buffer.length;
          buffers.push(buffer);
        }
      }

      this[BUFFER] = Buffer.concat(buffers);
      let type = options && options.type !== undefined && String(options.type).toLowerCase();

      if (type && !/[^\u0020-\u007E]/.test(type)) {
        this[TYPE$2] = type;
      }
    }

    get size() {
      return this[BUFFER].length;
    }

    get type() {
      return this[TYPE$2];
    }

    text() {
      return Promise.resolve(this[BUFFER].toString());
    }

    arrayBuffer() {
      const buf = this[BUFFER];
      const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
      return Promise.resolve(ab);
    }

    stream() {
      const readable = new Readable$1();

      readable._read = function () {};

      readable.push(this[BUFFER]);
      readable.push(null);
      return readable;
    }

    toString() {
      return '[object Blob]';
    }

    slice() {
      const size = this.size;
      const start = arguments[0];
      const end = arguments[1];
      let relativeStart, relativeEnd;

      if (start === undefined) {
        relativeStart = 0;
      } else if (start < 0) {
        relativeStart = Math.max(size + start, 0);
      } else {
        relativeStart = Math.min(start, size);
      }

      if (end === undefined) {
        relativeEnd = size;
      } else if (end < 0) {
        relativeEnd = Math.max(size + end, 0);
      } else {
        relativeEnd = Math.min(end, size);
      }

      const span = Math.max(relativeEnd - relativeStart, 0);
      const buffer = this[BUFFER];
      const slicedBuffer = buffer.slice(relativeStart, relativeStart + span);
      const blob = new Blob([], {
        type: arguments[2]
      });
      blob[BUFFER] = slicedBuffer;
      return blob;
    }

  }

  Object.defineProperties(Blob.prototype, {
    size: {
      enumerable: true
    },
    type: {
      enumerable: true
    },
    slice: {
      enumerable: true
    }
  });
  Object.defineProperty(Blob.prototype, Symbol.toStringTag, {
    value: 'Blob',
    writable: false,
    enumerable: false,
    configurable: true
  });
  /**
   * fetch-error.js
   *
   * FetchError interface for operational errors
   */

  /**
   * Create FetchError instance
   *
   * @param   String      message      Error message for human
   * @param   String      type         Error type for machine
   * @param   String      systemError  For Node.js system error
   * @return  FetchError
   */

  function FetchError(message, type, systemError) {
    Error.call(this, message);
    this.message = message;
    this.type = type; // when err.type is `system`, err.code contains system error code

    if (systemError) {
      this.code = this.errno = systemError.code;
    } // hide custom error implementation details from end-users


    Error.captureStackTrace(this, this.constructor);
  }

  FetchError.prototype = Object.create(Error.prototype);
  FetchError.prototype.constructor = FetchError;
  FetchError.prototype.name = 'FetchError';
  let convert;

  try {
    convert = require('encoding').convert;
  } catch (e) {}

  const INTERNALS = Symbol('Body internals'); // fix an issue where "PassThrough" isn't a named export for node <10

  const PassThrough$1 = Stream.PassThrough;
  /**
   * Body mixin
   *
   * Ref: https://fetch.spec.whatwg.org/#body
   *
   * @param   Stream  body  Readable stream
   * @param   Object  opts  Response options
   * @return  Void
   */

  function Body(body) {
    var _this = this;

    var _ref = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
        _ref$size = _ref.size;

    let size = _ref$size === undefined ? 0 : _ref$size;
    var _ref$timeout = _ref.timeout;
    let timeout = _ref$timeout === undefined ? 0 : _ref$timeout;

    if (body == null) {
      // body is undefined or null
      body = null;
    } else if (isURLSearchParams(body)) {
      // body is a URLSearchParams
      body = Buffer.from(body.toString());
    } else if (isBlob(body)) ;else if (Buffer.isBuffer(body)) ;else if (Object.prototype.toString.call(body) === '[object ArrayBuffer]') {
      // body is ArrayBuffer
      body = Buffer.from(body);
    } else if (ArrayBuffer.isView(body)) {
      // body is ArrayBufferView
      body = Buffer.from(body.buffer, body.byteOffset, body.byteLength);
    } else if (body instanceof Stream) ;else {
      // none of the above
      // coerce to string then buffer
      body = Buffer.from(String(body));
    }

    this[INTERNALS] = {
      body,
      disturbed: false,
      error: null
    };
    this.size = size;
    this.timeout = timeout;

    if (body instanceof Stream) {
      body.on('error', function (err) {
        const error = err.name === 'AbortError' ? err : new FetchError(`Invalid response body while trying to fetch ${_this.url}: ${err.message}`, 'system', err);
        _this[INTERNALS].error = error;
      });
    }
  }

  Body.prototype = {
    get body() {
      return this[INTERNALS].body;
    },

    get bodyUsed() {
      return this[INTERNALS].disturbed;
    },

    /**
     * Decode response as ArrayBuffer
     *
     * @return  Promise
     */
    arrayBuffer() {
      return consumeBody.call(this).then(function (buf) {
        return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
      });
    },

    /**
     * Return raw response as Blob
     *
     * @return Promise
     */
    blob() {
      let ct = this.headers && this.headers.get('content-type') || '';
      return consumeBody.call(this).then(function (buf) {
        return Object.assign( // Prevent copying
        new Blob([], {
          type: ct.toLowerCase()
        }), {
          [BUFFER]: buf
        });
      });
    },

    /**
     * Decode response as json
     *
     * @return  Promise
     */
    json() {
      var _this2 = this;

      return consumeBody.call(this).then(function (buffer) {
        try {
          return JSON.parse(buffer.toString());
        } catch (err) {
          return Body.Promise.reject(new FetchError(`invalid json response body at ${_this2.url} reason: ${err.message}`, 'invalid-json'));
        }
      });
    },

    /**
     * Decode response as text
     *
     * @return  Promise
     */
    text() {
      return consumeBody.call(this).then(function (buffer) {
        return buffer.toString();
      });
    },

    /**
     * Decode response as buffer (non-spec api)
     *
     * @return  Promise
     */
    buffer() {
      return consumeBody.call(this);
    },

    /**
     * Decode response as text, while automatically detecting the encoding and
     * trying to decode to UTF-8 (non-spec api)
     *
     * @return  Promise
     */
    textConverted() {
      var _this3 = this;

      return consumeBody.call(this).then(function (buffer) {
        return convertBody(buffer, _this3.headers);
      });
    }

  }; // In browsers, all properties are enumerable.

  Object.defineProperties(Body.prototype, {
    body: {
      enumerable: true
    },
    bodyUsed: {
      enumerable: true
    },
    arrayBuffer: {
      enumerable: true
    },
    blob: {
      enumerable: true
    },
    json: {
      enumerable: true
    },
    text: {
      enumerable: true
    }
  });

  Body.mixIn = function (proto) {
    for (const name of Object.getOwnPropertyNames(Body.prototype)) {
      // istanbul ignore else: future proof
      if (!(name in proto)) {
        const desc = Object.getOwnPropertyDescriptor(Body.prototype, name);
        Object.defineProperty(proto, name, desc);
      }
    }
  };
  /**
   * Consume and convert an entire Body to a Buffer.
   *
   * Ref: https://fetch.spec.whatwg.org/#concept-body-consume-body
   *
   * @return  Promise
   */


  function consumeBody() {
    var _this4 = this;

    if (this[INTERNALS].disturbed) {
      return Body.Promise.reject(new TypeError(`body used already for: ${this.url}`));
    }

    this[INTERNALS].disturbed = true;

    if (this[INTERNALS].error) {
      return Body.Promise.reject(this[INTERNALS].error);
    }

    let body = this.body; // body is null

    if (body === null) {
      return Body.Promise.resolve(Buffer.alloc(0));
    } // body is blob


    if (isBlob(body)) {
      body = body.stream();
    } // body is buffer


    if (Buffer.isBuffer(body)) {
      return Body.Promise.resolve(body);
    } // istanbul ignore if: should never happen


    if (!(body instanceof Stream)) {
      return Body.Promise.resolve(Buffer.alloc(0));
    } // body is stream
    // get ready to actually consume the body


    let accum = [];
    let accumBytes = 0;
    let abort = false;
    return new Body.Promise(function (resolve, reject) {
      let resTimeout; // allow timeout on slow response body

      if (_this4.timeout) {
        resTimeout = setTimeout(function () {
          abort = true;
          reject(new FetchError(`Response timeout while trying to fetch ${_this4.url} (over ${_this4.timeout}ms)`, 'body-timeout'));
        }, _this4.timeout);
      } // handle stream errors


      body.on('error', function (err) {
        if (err.name === 'AbortError') {
          // if the request was aborted, reject with this Error
          abort = true;
          reject(err);
        } else {
          // other errors, such as incorrect content-encoding
          reject(new FetchError(`Invalid response body while trying to fetch ${_this4.url}: ${err.message}`, 'system', err));
        }
      });
      body.on('data', function (chunk) {
        if (abort || chunk === null) {
          return;
        }

        if (_this4.size && accumBytes + chunk.length > _this4.size) {
          abort = true;
          reject(new FetchError(`content size at ${_this4.url} over limit: ${_this4.size}`, 'max-size'));
          return;
        }

        accumBytes += chunk.length;
        accum.push(chunk);
      });
      body.on('end', function () {
        if (abort) {
          return;
        }

        clearTimeout(resTimeout);

        try {
          resolve(Buffer.concat(accum, accumBytes));
        } catch (err) {
          // handle streams that have accumulated too much data (issue #414)
          reject(new FetchError(`Could not create Buffer from response body for ${_this4.url}: ${err.message}`, 'system', err));
        }
      });
    });
  }
  /**
   * Detect buffer encoding and convert to target encoding
   * ref: http://www.w3.org/TR/2011/WD-html5-20110113/parsing.html#determining-the-character-encoding
   *
   * @param   Buffer  buffer    Incoming buffer
   * @param   String  encoding  Target encoding
   * @return  String
   */


  function convertBody(buffer, headers) {
    if (typeof convert !== 'function') {
      throw new Error('The package `encoding` must be installed to use the textConverted() function');
    }

    const ct = headers.get('content-type');
    let charset = 'utf-8';
    let res, str; // header

    if (ct) {
      res = /charset=([^;]*)/i.exec(ct);
    } // no charset in content type, peek at response body for at most 1024 bytes


    str = buffer.slice(0, 1024).toString(); // html5

    if (!res && str) {
      res = /<meta.+?charset=(['"])(.+?)\1/i.exec(str);
    } // html4


    if (!res && str) {
      res = /<meta[\s]+?http-equiv=(['"])content-type\1[\s]+?content=(['"])(.+?)\2/i.exec(str);

      if (res) {
        res = /charset=(.*)/i.exec(res.pop());
      }
    } // xml


    if (!res && str) {
      res = /<\?xml.+?encoding=(['"])(.+?)\1/i.exec(str);
    } // found charset


    if (res) {
      charset = res.pop(); // prevent decode issues when sites use incorrect encoding
      // ref: https://hsivonen.fi/encoding-menu/

      if (charset === 'gb2312' || charset === 'gbk') {
        charset = 'gb18030';
      }
    } // turn raw buffers into a single utf-8 buffer


    return convert(buffer, 'UTF-8', charset).toString();
  }
  /**
   * Detect a URLSearchParams object
   * ref: https://github.com/bitinn/node-fetch/issues/296#issuecomment-307598143
   *
   * @param   Object  obj     Object to detect by type or brand
   * @return  String
   */


  function isURLSearchParams(obj) {
    // Duck-typing as a necessary condition.
    if (typeof obj !== 'object' || typeof obj.append !== 'function' || typeof obj.delete !== 'function' || typeof obj.get !== 'function' || typeof obj.getAll !== 'function' || typeof obj.has !== 'function' || typeof obj.set !== 'function') {
      return false;
    } // Brand-checking and more duck-typing as optional condition.


    return obj.constructor.name === 'URLSearchParams' || Object.prototype.toString.call(obj) === '[object URLSearchParams]' || typeof obj.sort === 'function';
  }
  /**
   * Check if `obj` is a W3C `Blob` object (which `File` inherits from)
   * @param  {*} obj
   * @return {boolean}
   */


  function isBlob(obj) {
    return typeof obj === 'object' && typeof obj.arrayBuffer === 'function' && typeof obj.type === 'string' && typeof obj.stream === 'function' && typeof obj.constructor === 'function' && typeof obj.constructor.name === 'string' && /^(Blob|File)$/.test(obj.constructor.name) && /^(Blob|File)$/.test(obj[Symbol.toStringTag]);
  }
  /**
   * Clone body given Res/Req instance
   *
   * @param   Mixed  instance  Response or Request instance
   * @return  Mixed
   */


  function clone$1(instance) {
    let p1, p2;
    let body = instance.body; // don't allow cloning a used body

    if (instance.bodyUsed) {
      throw new Error('cannot clone body after it is used');
    } // check that body is a stream and not form-data object
    // note: we can't clone the form-data object without having it as a dependency


    if (body instanceof Stream && typeof body.getBoundary !== 'function') {
      // tee instance body
      p1 = new PassThrough$1();
      p2 = new PassThrough$1();
      body.pipe(p1);
      body.pipe(p2); // set instance body to teed body and return the other teed body

      instance[INTERNALS].body = p1;
      body = p2;
    }

    return body;
  }
  /**
   * Performs the operation "extract a `Content-Type` value from |object|" as
   * specified in the specification:
   * https://fetch.spec.whatwg.org/#concept-bodyinit-extract
   *
   * This function assumes that instance.body is present.
   *
   * @param   Mixed  instance  Any options.body input
   */


  function extractContentType(body) {
    if (body === null) {
      // body is null
      return null;
    } else if (typeof body === 'string') {
      // body is string
      return 'text/plain;charset=UTF-8';
    } else if (isURLSearchParams(body)) {
      // body is a URLSearchParams
      return 'application/x-www-form-urlencoded;charset=UTF-8';
    } else if (isBlob(body)) {
      // body is blob
      return body.type || null;
    } else if (Buffer.isBuffer(body)) {
      // body is buffer
      return null;
    } else if (Object.prototype.toString.call(body) === '[object ArrayBuffer]') {
      // body is ArrayBuffer
      return null;
    } else if (ArrayBuffer.isView(body)) {
      // body is ArrayBufferView
      return null;
    } else if (typeof body.getBoundary === 'function') {
      // detect form data input from form-data module
      return `multipart/form-data;boundary=${body.getBoundary()}`;
    } else if (body instanceof Stream) {
      // body is stream
      // can't really do much about this
      return null;
    } else {
      // Body constructor defaults other things to string
      return 'text/plain;charset=UTF-8';
    }
  }
  /**
   * The Fetch Standard treats this as if "total bytes" is a property on the body.
   * For us, we have to explicitly get it with a function.
   *
   * ref: https://fetch.spec.whatwg.org/#concept-body-total-bytes
   *
   * @param   Body    instance   Instance of Body
   * @return  Number?            Number of bytes, or null if not possible
   */


  function getTotalBytes(instance) {
    const body = instance.body;

    if (body === null) {
      // body is null
      return 0;
    } else if (isBlob(body)) {
      return body.size;
    } else if (Buffer.isBuffer(body)) {
      // body is buffer
      return body.length;
    } else if (body && typeof body.getLengthSync === 'function') {
      // detect form data input from form-data module
      if (body._lengthRetrievers && body._lengthRetrievers.length == 0 || // 1.x
      body.hasKnownLength && body.hasKnownLength()) {
        // 2.x
        return body.getLengthSync();
      }

      return null;
    } else {
      // body is stream
      return null;
    }
  }
  /**
   * Write a Body to a Node.js WritableStream (e.g. http.Request) object.
   *
   * @param   Body    instance   Instance of Body
   * @return  Void
   */


  function writeToStream(dest, instance) {
    const body = instance.body;

    if (body === null) {
      // body is null
      dest.end();
    } else if (isBlob(body)) {
      body.stream().pipe(dest);
    } else if (Buffer.isBuffer(body)) {
      // body is buffer
      dest.write(body);
      dest.end();
    } else {
      // body is stream
      body.pipe(dest);
    }
  } // expose Promise


  Body.Promise = global.Promise;
  /**
   * headers.js
   *
   * Headers class offers convenient helpers
   */

  const invalidTokenRegex = /[^\^_`a-zA-Z\-0-9!#$%&'*+.|~]/;
  const invalidHeaderCharRegex = /[^\t\x20-\x7e\x80-\xff]/;

  function validateName(name) {
    name = `${name}`;

    if (invalidTokenRegex.test(name) || name === '') {
      throw new TypeError(`${name} is not a legal HTTP header name`);
    }
  }

  function validateValue(value) {
    value = `${value}`;

    if (invalidHeaderCharRegex.test(value)) {
      throw new TypeError(`${value} is not a legal HTTP header value`);
    }
  }
  /**
   * Find the key in the map object given a header name.
   *
   * Returns undefined if not found.
   *
   * @param   String  name  Header name
   * @return  String|Undefined
   */


  function find(map, name) {
    name = name.toLowerCase();

    for (const key in map) {
      if (key.toLowerCase() === name) {
        return key;
      }
    }

    return undefined;
  }

  const MAP = Symbol('map');

  class Headers {
    /**
     * Headers class
     *
     * @param   Object  headers  Response headers
     * @return  Void
     */
    constructor() {
      let init = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : undefined;
      this[MAP] = Object.create(null);

      if (init instanceof Headers) {
        const rawHeaders = init.raw();
        const headerNames = Object.keys(rawHeaders);

        for (const headerName of headerNames) {
          for (const value of rawHeaders[headerName]) {
            this.append(headerName, value);
          }
        }

        return;
      } // We don't worry about converting prop to ByteString here as append()
      // will handle it.


      if (init == null) ;else if (typeof init === 'object') {
        const method = init[Symbol.iterator];

        if (method != null) {
          if (typeof method !== 'function') {
            throw new TypeError('Header pairs must be iterable');
          } // sequence<sequence<ByteString>>
          // Note: per spec we have to first exhaust the lists then process them


          const pairs = [];

          for (const pair of init) {
            if (typeof pair !== 'object' || typeof pair[Symbol.iterator] !== 'function') {
              throw new TypeError('Each header pair must be iterable');
            }

            pairs.push(Array.from(pair));
          }

          for (const pair of pairs) {
            if (pair.length !== 2) {
              throw new TypeError('Each header pair must be a name/value tuple');
            }

            this.append(pair[0], pair[1]);
          }
        } else {
          // record<ByteString, ByteString>
          for (const key of Object.keys(init)) {
            const value = init[key];
            this.append(key, value);
          }
        }
      } else {
        throw new TypeError('Provided initializer must be an object');
      }
    }
    /**
     * Return combined header value given name
     *
     * @param   String  name  Header name
     * @return  Mixed
     */


    get(name) {
      name = `${name}`;
      validateName(name);
      const key = find(this[MAP], name);

      if (key === undefined) {
        return null;
      }

      return this[MAP][key].join(', ');
    }
    /**
     * Iterate over all headers
     *
     * @param   Function  callback  Executed for each item with parameters (value, name, thisArg)
     * @param   Boolean   thisArg   `this` context for callback function
     * @return  Void
     */


    forEach(callback) {
      let thisArg = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : undefined;
      let pairs = getHeaders(this);
      let i = 0;

      while (i < pairs.length) {
        var _pairs$i = pairs[i];
        const name = _pairs$i[0],
              value = _pairs$i[1];
        callback.call(thisArg, value, name, this);
        pairs = getHeaders(this);
        i++;
      }
    }
    /**
     * Overwrite header values given name
     *
     * @param   String  name   Header name
     * @param   String  value  Header value
     * @return  Void
     */


    set(name, value) {
      name = `${name}`;
      value = `${value}`;
      validateName(name);
      validateValue(value);
      const key = find(this[MAP], name);
      this[MAP][key !== undefined ? key : name] = [value];
    }
    /**
     * Append a value onto existing header
     *
     * @param   String  name   Header name
     * @param   String  value  Header value
     * @return  Void
     */


    append(name, value) {
      name = `${name}`;
      value = `${value}`;
      validateName(name);
      validateValue(value);
      const key = find(this[MAP], name);

      if (key !== undefined) {
        this[MAP][key].push(value);
      } else {
        this[MAP][name] = [value];
      }
    }
    /**
     * Check for header name existence
     *
     * @param   String   name  Header name
     * @return  Boolean
     */


    has(name) {
      name = `${name}`;
      validateName(name);
      return find(this[MAP], name) !== undefined;
    }
    /**
     * Delete all header values given name
     *
     * @param   String  name  Header name
     * @return  Void
     */


    delete(name) {
      name = `${name}`;
      validateName(name);
      const key = find(this[MAP], name);

      if (key !== undefined) {
        delete this[MAP][key];
      }
    }
    /**
     * Return raw headers (non-spec api)
     *
     * @return  Object
     */


    raw() {
      return this[MAP];
    }
    /**
     * Get an iterator on keys.
     *
     * @return  Iterator
     */


    keys() {
      return createHeadersIterator(this, 'key');
    }
    /**
     * Get an iterator on values.
     *
     * @return  Iterator
     */


    values() {
      return createHeadersIterator(this, 'value');
    }
    /**
     * Get an iterator on entries.
     *
     * This is the default iterator of the Headers object.
     *
     * @return  Iterator
     */


    [Symbol.iterator]() {
      return createHeadersIterator(this, 'key+value');
    }

  }

  Headers.prototype.entries = Headers.prototype[Symbol.iterator];
  Object.defineProperty(Headers.prototype, Symbol.toStringTag, {
    value: 'Headers',
    writable: false,
    enumerable: false,
    configurable: true
  });
  Object.defineProperties(Headers.prototype, {
    get: {
      enumerable: true
    },
    forEach: {
      enumerable: true
    },
    set: {
      enumerable: true
    },
    append: {
      enumerable: true
    },
    has: {
      enumerable: true
    },
    delete: {
      enumerable: true
    },
    keys: {
      enumerable: true
    },
    values: {
      enumerable: true
    },
    entries: {
      enumerable: true
    }
  });

  function getHeaders(headers) {
    let kind = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'key+value';
    const keys = Object.keys(headers[MAP]).sort();
    return keys.map(kind === 'key' ? function (k) {
      return k.toLowerCase();
    } : kind === 'value' ? function (k) {
      return headers[MAP][k].join(', ');
    } : function (k) {
      return [k.toLowerCase(), headers[MAP][k].join(', ')];
    });
  }

  const INTERNAL = Symbol('internal');

  function createHeadersIterator(target, kind) {
    const iterator = Object.create(HeadersIteratorPrototype);
    iterator[INTERNAL] = {
      target,
      kind,
      index: 0
    };
    return iterator;
  }

  const HeadersIteratorPrototype = Object.setPrototypeOf({
    next() {
      // istanbul ignore if
      if (!this || Object.getPrototypeOf(this) !== HeadersIteratorPrototype) {
        throw new TypeError('Value of `this` is not a HeadersIterator');
      }

      var _INTERNAL = this[INTERNAL];
      const target = _INTERNAL.target,
            kind = _INTERNAL.kind,
            index = _INTERNAL.index;
      const values = getHeaders(target, kind);
      const len = values.length;

      if (index >= len) {
        return {
          value: undefined,
          done: true
        };
      }

      this[INTERNAL].index = index + 1;
      return {
        value: values[index],
        done: false
      };
    }

  }, Object.getPrototypeOf(Object.getPrototypeOf([][Symbol.iterator]())));
  Object.defineProperty(HeadersIteratorPrototype, Symbol.toStringTag, {
    value: 'HeadersIterator',
    writable: false,
    enumerable: false,
    configurable: true
  });
  /**
   * Export the Headers object in a form that Node.js can consume.
   *
   * @param   Headers  headers
   * @return  Object
   */

  function exportNodeCompatibleHeaders(headers) {
    const obj = Object.assign({
      __proto__: null
    }, headers[MAP]); // http.request() only supports string as Host header. This hack makes
    // specifying custom Host header possible.

    const hostHeaderKey = find(headers[MAP], 'Host');

    if (hostHeaderKey !== undefined) {
      obj[hostHeaderKey] = obj[hostHeaderKey][0];
    }

    return obj;
  }
  /**
   * Create a Headers object from an object of headers, ignoring those that do
   * not conform to HTTP grammar productions.
   *
   * @param   Object  obj  Object of headers
   * @return  Headers
   */


  function createHeadersLenient(obj) {
    const headers = new Headers();

    for (const name of Object.keys(obj)) {
      if (invalidTokenRegex.test(name)) {
        continue;
      }

      if (Array.isArray(obj[name])) {
        for (const val of obj[name]) {
          if (invalidHeaderCharRegex.test(val)) {
            continue;
          }

          if (headers[MAP][name] === undefined) {
            headers[MAP][name] = [val];
          } else {
            headers[MAP][name].push(val);
          }
        }
      } else if (!invalidHeaderCharRegex.test(obj[name])) {
        headers[MAP][name] = [obj[name]];
      }
    }

    return headers;
  }

  const INTERNALS$1 = Symbol('Response internals'); // fix an issue where "STATUS_CODES" aren't a named export for node <10

  const STATUS_CODES$2 = http.STATUS_CODES;
  /**
   * Response class
   *
   * @param   Stream  body  Readable stream
   * @param   Object  opts  Response options
   * @return  Void
   */

  class Response {
    constructor() {
      let body = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
      let opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      Body.call(this, body, opts);
      const status = opts.status || 200;
      const headers = new Headers(opts.headers);

      if (body != null && !headers.has('Content-Type')) {
        const contentType = extractContentType(body);

        if (contentType) {
          headers.append('Content-Type', contentType);
        }
      }

      this[INTERNALS$1] = {
        url: opts.url,
        status,
        statusText: opts.statusText || STATUS_CODES$2[status],
        headers,
        counter: opts.counter
      };
    }

    get url() {
      return this[INTERNALS$1].url || '';
    }

    get status() {
      return this[INTERNALS$1].status;
    }
    /**
     * Convenience property representing if the request ended normally
     */


    get ok() {
      return this[INTERNALS$1].status >= 200 && this[INTERNALS$1].status < 300;
    }

    get redirected() {
      return this[INTERNALS$1].counter > 0;
    }

    get statusText() {
      return this[INTERNALS$1].statusText;
    }

    get headers() {
      return this[INTERNALS$1].headers;
    }
    /**
     * Clone this response
     *
     * @return  Response
     */


    clone() {
      return new Response(clone$1(this), {
        url: this.url,
        status: this.status,
        statusText: this.statusText,
        headers: this.headers,
        ok: this.ok,
        redirected: this.redirected
      });
    }

  }

  Body.mixIn(Response.prototype);
  Object.defineProperties(Response.prototype, {
    url: {
      enumerable: true
    },
    status: {
      enumerable: true
    },
    ok: {
      enumerable: true
    },
    redirected: {
      enumerable: true
    },
    statusText: {
      enumerable: true
    },
    headers: {
      enumerable: true
    },
    clone: {
      enumerable: true
    }
  });
  Object.defineProperty(Response.prototype, Symbol.toStringTag, {
    value: 'Response',
    writable: false,
    enumerable: false,
    configurable: true
  });
  const INTERNALS$2 = Symbol('Request internals'); // fix an issue where "format", "parse" aren't a named export for node <10

  const parse_url = Url.parse;
  const format_url = Url.format;
  const streamDestructionSupported = 'destroy' in Stream.Readable.prototype;
  /**
   * Check if a value is an instance of Request.
   *
   * @param   Mixed   input
   * @return  Boolean
   */

  function isRequest(input) {
    return typeof input === 'object' && typeof input[INTERNALS$2] === 'object';
  }

  function isAbortSignal(signal) {
    const proto = signal && typeof signal === 'object' && Object.getPrototypeOf(signal);
    return !!(proto && proto.constructor.name === 'AbortSignal');
  }
  /**
   * Request class
   *
   * @param   Mixed   input  Url or Request instance
   * @param   Object  init   Custom options
   * @return  Void
   */


  class Request {
    constructor(input) {
      let init = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      let parsedURL; // normalize input

      if (!isRequest(input)) {
        if (input && input.href) {
          // in order to support Node.js' Url objects; though WHATWG's URL objects
          // will fall into this branch also (since their `toString()` will return
          // `href` property anyway)
          parsedURL = parse_url(input.href);
        } else {
          // coerce input to a string before attempting to parse
          parsedURL = parse_url(`${input}`);
        }

        input = {};
      } else {
        parsedURL = parse_url(input.url);
      }

      let method = init.method || input.method || 'GET';
      method = method.toUpperCase();

      if ((init.body != null || isRequest(input) && input.body !== null) && (method === 'GET' || method === 'HEAD')) {
        throw new TypeError('Request with GET/HEAD method cannot have body');
      }

      let inputBody = init.body != null ? init.body : isRequest(input) && input.body !== null ? clone$1(input) : null;
      Body.call(this, inputBody, {
        timeout: init.timeout || input.timeout || 0,
        size: init.size || input.size || 0
      });
      const headers = new Headers(init.headers || input.headers || {});

      if (inputBody != null && !headers.has('Content-Type')) {
        const contentType = extractContentType(inputBody);

        if (contentType) {
          headers.append('Content-Type', contentType);
        }
      }

      let signal = isRequest(input) ? input.signal : null;
      if ('signal' in init) signal = init.signal;

      if (signal != null && !isAbortSignal(signal)) {
        throw new TypeError('Expected signal to be an instanceof AbortSignal');
      }

      this[INTERNALS$2] = {
        method,
        redirect: init.redirect || input.redirect || 'follow',
        headers,
        parsedURL,
        signal
      }; // node-fetch-only options

      this.follow = init.follow !== undefined ? init.follow : input.follow !== undefined ? input.follow : 20;
      this.compress = init.compress !== undefined ? init.compress : input.compress !== undefined ? input.compress : true;
      this.counter = init.counter || input.counter || 0;
      this.agent = init.agent || input.agent;
    }

    get method() {
      return this[INTERNALS$2].method;
    }

    get url() {
      return format_url(this[INTERNALS$2].parsedURL);
    }

    get headers() {
      return this[INTERNALS$2].headers;
    }

    get redirect() {
      return this[INTERNALS$2].redirect;
    }

    get signal() {
      return this[INTERNALS$2].signal;
    }
    /**
     * Clone this request
     *
     * @return  Request
     */


    clone() {
      return new Request(this);
    }

  }

  Body.mixIn(Request.prototype);
  Object.defineProperty(Request.prototype, Symbol.toStringTag, {
    value: 'Request',
    writable: false,
    enumerable: false,
    configurable: true
  });
  Object.defineProperties(Request.prototype, {
    method: {
      enumerable: true
    },
    url: {
      enumerable: true
    },
    headers: {
      enumerable: true
    },
    redirect: {
      enumerable: true
    },
    clone: {
      enumerable: true
    },
    signal: {
      enumerable: true
    }
  });
  /**
   * Convert a Request to Node.js http request options.
   *
   * @param   Request  A Request instance
   * @return  Object   The options object to be passed to http.request
   */

  function getNodeRequestOptions(request) {
    const parsedURL = request[INTERNALS$2].parsedURL;
    const headers = new Headers(request[INTERNALS$2].headers); // fetch step 1.3

    if (!headers.has('Accept')) {
      headers.set('Accept', '*/*');
    } // Basic fetch


    if (!parsedURL.protocol || !parsedURL.hostname) {
      throw new TypeError('Only absolute URLs are supported');
    }

    if (!/^https?:$/.test(parsedURL.protocol)) {
      throw new TypeError('Only HTTP(S) protocols are supported');
    }

    if (request.signal && request.body instanceof Stream.Readable && !streamDestructionSupported) {
      throw new Error('Cancellation of streamed requests with AbortSignal is not supported in node < 8');
    } // HTTP-network-or-cache fetch steps 2.4-2.7


    let contentLengthValue = null;

    if (request.body == null && /^(POST|PUT)$/i.test(request.method)) {
      contentLengthValue = '0';
    }

    if (request.body != null) {
      const totalBytes = getTotalBytes(request);

      if (typeof totalBytes === 'number') {
        contentLengthValue = String(totalBytes);
      }
    }

    if (contentLengthValue) {
      headers.set('Content-Length', contentLengthValue);
    } // HTTP-network-or-cache fetch step 2.11


    if (!headers.has('User-Agent')) {
      headers.set('User-Agent', 'node-fetch/1.0 (+https://github.com/bitinn/node-fetch)');
    } // HTTP-network-or-cache fetch step 2.15


    if (request.compress && !headers.has('Accept-Encoding')) {
      headers.set('Accept-Encoding', 'gzip,deflate');
    }

    let agent = request.agent;

    if (typeof agent === 'function') {
      agent = agent(parsedURL);
    }

    if (!headers.has('Connection') && !agent) {
      headers.set('Connection', 'close');
    } // HTTP-network fetch step 4.2
    // chunked encoding is handled by Node.js


    return Object.assign({}, parsedURL, {
      method: request.method,
      headers: exportNodeCompatibleHeaders(headers),
      agent
    });
  }
  /**
   * abort-error.js
   *
   * AbortError interface for cancelled requests
   */

  /**
   * Create AbortError instance
   *
   * @param   String      message      Error message for human
   * @return  AbortError
   */


  function AbortError(message) {
    Error.call(this, message);
    this.type = 'aborted';
    this.message = message; // hide custom error implementation details from end-users

    Error.captureStackTrace(this, this.constructor);
  }

  AbortError.prototype = Object.create(Error.prototype);
  AbortError.prototype.constructor = AbortError;
  AbortError.prototype.name = 'AbortError'; // fix an issue where "PassThrough", "resolve" aren't a named export for node <10

  const PassThrough$1$1 = Stream.PassThrough;
  const resolve_url = Url.resolve;
  /**
   * Fetch function
   *
   * @param   Mixed    url   Absolute url or Request instance
   * @param   Object   opts  Fetch options
   * @return  Promise
   */

  function fetch(url, opts) {
    // allow custom promise
    if (!fetch.Promise) {
      throw new Error('native promise missing, set fetch.Promise to your favorite alternative');
    }

    Body.Promise = fetch.Promise; // wrap http.request into fetch

    return new fetch.Promise(function (resolve, reject) {
      // build request object
      const request = new Request(url, opts);
      const options = getNodeRequestOptions(request);
      const send = (options.protocol === 'https:' ? http : http).request;
      const signal = request.signal;
      let response = null;

      const abort = function abort() {
        let error = new AbortError('The user aborted a request.');
        reject(error);

        if (request.body && request.body instanceof Stream.Readable) {
          request.body.destroy(error);
        }

        if (!response || !response.body) return;
        response.body.emit('error', error);
      };

      if (signal && signal.aborted) {
        abort();
        return;
      }

      const abortAndFinalize = function abortAndFinalize() {
        abort();
        finalize();
      }; // send request


      const req = send(options);
      let reqTimeout;

      if (signal) {
        signal.addEventListener('abort', abortAndFinalize);
      }

      function finalize() {
        req.abort();
        if (signal) signal.removeEventListener('abort', abortAndFinalize);
        clearTimeout(reqTimeout);
      }

      if (request.timeout) {
        req.once('socket', function (socket) {
          reqTimeout = setTimeout(function () {
            reject(new FetchError(`network timeout at: ${request.url}`, 'request-timeout'));
            finalize();
          }, request.timeout);
        });
      }

      req.on('error', function (err) {
        reject(new FetchError(`request to ${request.url} failed, reason: ${err.message}`, 'system', err));
        finalize();
      });
      req.on('response', function (res) {
        clearTimeout(reqTimeout);
        const headers = createHeadersLenient(res.headers); // HTTP fetch step 5

        if (fetch.isRedirect(res.statusCode)) {
          // HTTP fetch step 5.2
          const location = headers.get('Location'); // HTTP fetch step 5.3

          const locationURL = location === null ? null : resolve_url(request.url, location); // HTTP fetch step 5.5

          switch (request.redirect) {
            case 'error':
              reject(new FetchError(`redirect mode is set to error: ${request.url}`, 'no-redirect'));
              finalize();
              return;

            case 'manual':
              // node-fetch-specific step: make manual redirect a bit easier to use by setting the Location header value to the resolved URL.
              if (locationURL !== null) {
                // handle corrupted header
                try {
                  headers.set('Location', locationURL);
                } catch (err) {
                  // istanbul ignore next: nodejs server prevent invalid response headers, we can't test this through normal request
                  reject(err);
                }
              }

              break;

            case 'follow':
              // HTTP-redirect fetch step 2
              if (locationURL === null) {
                break;
              } // HTTP-redirect fetch step 5


              if (request.counter >= request.follow) {
                reject(new FetchError(`maximum redirect reached at: ${request.url}`, 'max-redirect'));
                finalize();
                return;
              } // HTTP-redirect fetch step 6 (counter increment)
              // Create a new Request object.


              const requestOpts = {
                headers: new Headers(request.headers),
                follow: request.follow,
                counter: request.counter + 1,
                agent: request.agent,
                compress: request.compress,
                method: request.method,
                body: request.body,
                signal: request.signal,
                timeout: request.timeout
              }; // HTTP-redirect fetch step 9

              if (res.statusCode !== 303 && request.body && getTotalBytes(request) === null) {
                reject(new FetchError('Cannot follow redirect with body being a readable stream', 'unsupported-redirect'));
                finalize();
                return;
              } // HTTP-redirect fetch step 11


              if (res.statusCode === 303 || (res.statusCode === 301 || res.statusCode === 302) && request.method === 'POST') {
                requestOpts.method = 'GET';
                requestOpts.body = undefined;
                requestOpts.headers.delete('content-length');
              } // HTTP-redirect fetch step 15


              resolve(fetch(new Request(locationURL, requestOpts)));
              finalize();
              return;
          }
        } // prepare response


        res.once('end', function () {
          if (signal) signal.removeEventListener('abort', abortAndFinalize);
        });
        let body = res.pipe(new PassThrough$1$1());
        const response_options = {
          url: request.url,
          status: res.statusCode,
          statusText: res.statusMessage,
          headers: headers,
          size: request.size,
          timeout: request.timeout,
          counter: request.counter
        }; // HTTP-network fetch step 12.1.1.3

        const codings = headers.get('Content-Encoding'); // HTTP-network fetch step 12.1.1.4: handle content codings
        // in following scenarios we ignore compression support
        // 1. compression support is disabled
        // 2. HEAD request
        // 3. no Content-Encoding header
        // 4. no content response (204)
        // 5. content not modified response (304)

        if (!request.compress || request.method === 'HEAD' || codings === null || res.statusCode === 204 || res.statusCode === 304) {
          response = new Response(body, response_options);
          resolve(response);
          return;
        } // For Node v6+
        // Be less strict when decoding compressed responses, since sometimes
        // servers send slightly invalid responses that are still accepted
        // by common browsers.
        // Always using Z_SYNC_FLUSH is what cURL does.


        const zlibOptions = {
          flush: zlib.Z_SYNC_FLUSH,
          finishFlush: zlib.Z_SYNC_FLUSH
        }; // for gzip

        if (codings == 'gzip' || codings == 'x-gzip') {
          body = body.pipe(zlib.createGunzip(zlibOptions));
          response = new Response(body, response_options);
          resolve(response);
          return;
        } // for deflate


        if (codings == 'deflate' || codings == 'x-deflate') {
          // handle the infamous raw deflate response from old servers
          // a hack for old IIS and Apache servers
          const raw = res.pipe(new PassThrough$1$1());
          raw.once('data', function (chunk) {
            // see http://stackoverflow.com/questions/37519828
            if ((chunk[0] & 0x0F) === 0x08) {
              body = body.pipe(zlib.createInflate());
            } else {
              body = body.pipe(zlib.createInflateRaw());
            }

            response = new Response(body, response_options);
            resolve(response);
          });
          return;
        } // for br


        if (codings == 'br' && typeof zlib.createBrotliDecompress === 'function') {
          body = body.pipe(zlib.createBrotliDecompress());
          response = new Response(body, response_options);
          resolve(response);
          return;
        } // otherwise, use response as-is


        response = new Response(body, response_options);
        resolve(response);
      });
      writeToStream(req, request);
    });
  }
  /**
   * Redirect code matching
   *
   * @param   Number   code  Status code
   * @return  Boolean
   */


  fetch.isRedirect = function (code) {
    return code === 301 || code === 302 || code === 303 || code === 307 || code === 308;
  }; // expose Promise


  fetch.Promise = global.Promise;

  var lib = /*#__PURE__*/Object.freeze({
    'default': fetch,
    Headers: Headers,
    Request: Request,
    Response: Response,
    FetchError: FetchError
  });

  class Element$3 extends Element_1 {
    setAttrs(attrs) {
      if (typeof attrs === 'string') {
        this.attrs.xmlns = attrs;
      } else if (attrs) {
        Object.keys(attrs).forEach(function (key) {
          const val = attrs[key];
          if (val !== undefined && val !== null) this.attrs[key.toString()] = val.toString();
        }, this);
      }
    }

    append(nodes) {
      nodes = Array.isArray(nodes) ? nodes : [nodes];
      nodes.forEach(node => {
        this.children.push(node);

        if (typeof node === 'object') {
          node.parent = this;
        }
      });
      return this;
    }

    prepend(nodes) {
      nodes = Array.isArray(nodes) ? nodes : [nodes];
      nodes.forEach(node => {
        this.children.unshift(node);

        if (typeof node === 'object') {
          node.parent = this;
        }
      });
      return this;
    }

  }

  var Element_1$2 = Element$3;

  class XMLError$2 extends Error {
    constructor(...args) {
      super(...args);
      this.name = 'XMLError';
    }

  }

  class Parser$3 extends EventEmitter {
    constructor() {
      super();
      const parser = new ltx();
      this.root = null;
      this.cursor = null;
      parser.on('startElement', this.onStartElement.bind(this));
      parser.on('endElement', this.onEndElement.bind(this));
      parser.on('text', this.onText.bind(this));
      this.parser = parser;
    }

    onStartElement(name, attrs) {
      const element = new Element_1$2(name, attrs);
      const {
        root,
        cursor
      } = this;

      if (!root) {
        this.root = element;
        this.emit('start', element);
      } else if (cursor !== root) {
        cursor.append(element);
      }

      this.cursor = element;
    }

    onEndElement(name) {
      const {
        root,
        cursor
      } = this;

      if (name !== cursor.name) {
        // <foo></bar>
        this.emit('error', new XMLError$2(`${cursor.name} must be closed.`));
        return;
      }

      if (cursor === root) {
        this.emit('end', root);
        return;
      }

      if (!cursor.parent) {
        if (cursor.name.startsWith('stream:')) {
          cursor.attrs['xmlns:stream'] = root.attrs['xmlns:stream'];
        }

        this.emit('element', cursor);
        this.cursor = root;
        return;
      }

      this.cursor = cursor.parent;
    }

    onText(str) {
      const {
        cursor
      } = this;

      if (!cursor) {
        this.emit('error', new XMLError$2(`${str} must be a child.`));
        return;
      }

      cursor.t(str);
    }

    write(data) {
      this.parser.write(data);
    }

    end(data) {
      if (data) {
        this.parser.write(data);
      }
    }

  }

  Parser$3.XMLError = XMLError$2;
  var Parser_1$1 = Parser$3;

  var parse$6 = function parse(data) {
    const p = new Parser_1$1();
    let result = null;
    let error = null;
    p.on('start', el => {
      result = el;
    });
    p.on('element', el => {
      result.append(el);
    });
    p.on('error', err => {
      error = err;
    });
    p.write(data);
    p.end();

    if (error) {
      throw error;
    } else {
      return result;
    }
  };

  var require$$0$2 = getCjsExportFromNamespace(lib);

  const fetch$1 = commonjsGlobal.fetch || require$$0$2;
  const compareAltConnections$1 = altConnections.compare;

  function resolve$1(domain) {
    return fetch$1(`https://${domain}/.well-known/host-meta`).then(res => res.text()).then(res => {
      return parse$6(res).getChildren('Link').filter(link => ['urn:xmpp:alt-connections:websocket', 'urn:xmpp:alt-connections:httppoll', 'urn:xmpp:alt-connections:xbosh'].includes(link.attrs.rel)).map(({
        attrs
      }) => ({
        rel: attrs.rel,
        href: attrs.href,
        method: attrs.rel.split(':').pop(),
        uri: attrs.href
      })).sort(compareAltConnections$1);
    }).catch(() => {
      return [];
    });
  }

  var resolve_1$1 = resolve$1;
  var http$1 = {
    resolve: resolve_1$1
  };

  var resolve$2 = createCommonjsModule(function (module) {
    module.exports = function resolve(...args) {
      return Promise.all([dns_1.resolve ? dns_1.resolve(...args) : Promise.resolve([]), http$1.resolve(...args)]).then(([records, endpoints]) => records.concat(endpoints));
    };

    if (dns_1.resolve) {
      module.exports.dns = dns_1;
    }

    module.exports.http = http$1;
  });
  var resolve_1$2 = resolve$2.dns;
  var resolve_2 = resolve$2.http;

  const {
    socketConnect: socketConnect$1
  } = esm$4;

  async function fetchURIs(domain) {
    return [// Remove duplicates
    ...new Set((await resolve$2(domain, {
      srv: [{
        service: 'xmpps-client',
        protocol: 'tcp'
      }, {
        service: 'xmpp-client',
        protocol: 'tcp'
      }]
    })).map(record => record.uri))];
  }

  function filterSupportedURIs(entity, uris) {
    return uris.filter(uri => entity._findTransport(uri));
  }

  async function fallbackConnect(entity, uris) {
    if (uris.length === 0) {
      throw new Error("Couldn't connect");
    }

    const uri = uris.shift();

    const Transport = entity._findTransport(uri);

    if (!Transport) {
      return fallbackConnect(entity, uris);
    }

    const params = Transport.prototype.socketParameters(uri);
    const socket = new Transport.prototype.Socket();

    try {
      await socketConnect$1(socket, params);
    } catch (err) {
      return fallbackConnect(entity, uris);
    }

    entity._attachSocket(socket);

    socket.emit('connect');
    entity.Transport = Transport;
    entity.Socket = Transport.prototype.Socket;
    entity.Parser = Transport.prototype.Parser;
  }

  var esm$f = function ({
    entity
  }) {
    const _connect = entity.connect;

    entity.connect = async function connect(service) {
      if (!service || service.match(/:\/\//)) {
        return _connect.call(this, service);
      }

      const uris = filterSupportedURIs(entity, (await fetchURIs(service)));

      if (uris.length === 0) {
        throw new Error('No compatible transport found.');
      }

      try {
        await fallbackConnect(entity, uris);
      } catch (err) {
        entity._reset();

        entity._status('disconnect');

        throw err;
      }
    };
  };

  /*
   * References
   * https://xmpp.org/rfcs/rfc6120.html#tls
   */

  const NS = 'urn:ietf:params:xml:ns:xmpp-tls';

  function proceed(entity, options = {}) {
    return new Promise((resolve, reject) => {
      const tlsSocket = require$$0$1.connect({
        socket: entity._detachSocket(),
        host: entity.options.domain,
        ...options
      }, err => {
        if (err) return reject(err);

        entity._attachSocket(tlsSocket);

        resolve();
      });
    });
  }

  async function starttls(entity) {
    const element = await entity.sendReceive(esm$2('starttls', {
      xmlns: NS
    }));

    if (element.is('proceed', NS)) {
      return element;
    }

    throw new Error('STARTTLS_FAILURE');
  }

  var client = function ({
    streamFeatures
  }) {
    return streamFeatures.use('starttls', NS, async ({
      entity
    }) => {
      await starttls(entity);
      await proceed(entity);
      await entity.restart();
    });
  };

  var esm$g = {
    client: client
  };

  var base64 = createCommonjsModule(function (module, exports) {

    (function (global, factory) {
       module.exports = factory(global) ;
    })(typeof self !== 'undefined' ? self : typeof window !== 'undefined' ? window : typeof commonjsGlobal !== 'undefined' ? commonjsGlobal : commonjsGlobal, function (global) {

      global = global || {};
      var _Base64 = global.Base64;
      var version = "2.5.1"; // if node.js and NOT React Native, we use Buffer

      var buffer;

      if ( module.exports) {
        try {
          buffer = eval("require('buffer').Buffer");
        } catch (err) {
          buffer = undefined;
        }
      } // constants


      var b64chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

      var b64tab = function (bin) {
        var t = {};

        for (var i = 0, l = bin.length; i < l; i++) t[bin.charAt(i)] = i;

        return t;
      }(b64chars);

      var fromCharCode = String.fromCharCode; // encoder stuff

      var cb_utob = function (c) {
        if (c.length < 2) {
          var cc = c.charCodeAt(0);
          return cc < 0x80 ? c : cc < 0x800 ? fromCharCode(0xc0 | cc >>> 6) + fromCharCode(0x80 | cc & 0x3f) : fromCharCode(0xe0 | cc >>> 12 & 0x0f) + fromCharCode(0x80 | cc >>> 6 & 0x3f) + fromCharCode(0x80 | cc & 0x3f);
        } else {
          var cc = 0x10000 + (c.charCodeAt(0) - 0xD800) * 0x400 + (c.charCodeAt(1) - 0xDC00);
          return fromCharCode(0xf0 | cc >>> 18 & 0x07) + fromCharCode(0x80 | cc >>> 12 & 0x3f) + fromCharCode(0x80 | cc >>> 6 & 0x3f) + fromCharCode(0x80 | cc & 0x3f);
        }
      };

      var re_utob = /[\uD800-\uDBFF][\uDC00-\uDFFFF]|[^\x00-\x7F]/g;

      var utob = function (u) {
        return u.replace(re_utob, cb_utob);
      };

      var cb_encode = function (ccc) {
        var padlen = [0, 2, 1][ccc.length % 3],
            ord = ccc.charCodeAt(0) << 16 | (ccc.length > 1 ? ccc.charCodeAt(1) : 0) << 8 | (ccc.length > 2 ? ccc.charCodeAt(2) : 0),
            chars = [b64chars.charAt(ord >>> 18), b64chars.charAt(ord >>> 12 & 63), padlen >= 2 ? '=' : b64chars.charAt(ord >>> 6 & 63), padlen >= 1 ? '=' : b64chars.charAt(ord & 63)];
        return chars.join('');
      };

      var btoa = global.btoa ? function (b) {
        return global.btoa(b);
      } : function (b) {
        return b.replace(/[\s\S]{1,3}/g, cb_encode);
      };

      var _encode = buffer ? buffer.from && Uint8Array && buffer.from !== Uint8Array.from ? function (u) {
        return (u.constructor === buffer.constructor ? u : buffer.from(u)).toString('base64');
      } : function (u) {
        return (u.constructor === buffer.constructor ? u : new buffer(u)).toString('base64');
      } : function (u) {
        return btoa(utob(u));
      };

      var encode = function (u, urisafe) {
        return !urisafe ? _encode(String(u)) : _encode(String(u)).replace(/[+\/]/g, function (m0) {
          return m0 == '+' ? '-' : '_';
        }).replace(/=/g, '');
      };

      var encodeURI = function (u) {
        return encode(u, true);
      }; // decoder stuff


      var re_btou = new RegExp(['[\xC0-\xDF][\x80-\xBF]', '[\xE0-\xEF][\x80-\xBF]{2}', '[\xF0-\xF7][\x80-\xBF]{3}'].join('|'), 'g');

      var cb_btou = function (cccc) {
        switch (cccc.length) {
          case 4:
            var cp = (0x07 & cccc.charCodeAt(0)) << 18 | (0x3f & cccc.charCodeAt(1)) << 12 | (0x3f & cccc.charCodeAt(2)) << 6 | 0x3f & cccc.charCodeAt(3),
                offset = cp - 0x10000;
            return fromCharCode((offset >>> 10) + 0xD800) + fromCharCode((offset & 0x3FF) + 0xDC00);

          case 3:
            return fromCharCode((0x0f & cccc.charCodeAt(0)) << 12 | (0x3f & cccc.charCodeAt(1)) << 6 | 0x3f & cccc.charCodeAt(2));

          default:
            return fromCharCode((0x1f & cccc.charCodeAt(0)) << 6 | 0x3f & cccc.charCodeAt(1));
        }
      };

      var btou = function (b) {
        return b.replace(re_btou, cb_btou);
      };

      var cb_decode = function (cccc) {
        var len = cccc.length,
            padlen = len % 4,
            n = (len > 0 ? b64tab[cccc.charAt(0)] << 18 : 0) | (len > 1 ? b64tab[cccc.charAt(1)] << 12 : 0) | (len > 2 ? b64tab[cccc.charAt(2)] << 6 : 0) | (len > 3 ? b64tab[cccc.charAt(3)] : 0),
            chars = [fromCharCode(n >>> 16), fromCharCode(n >>> 8 & 0xff), fromCharCode(n & 0xff)];
        chars.length -= [0, 0, 2, 1][padlen];
        return chars.join('');
      };

      var _atob = global.atob ? function (a) {
        return global.atob(a);
      } : function (a) {
        return a.replace(/\S{1,4}/g, cb_decode);
      };

      var atob = function (a) {
        return _atob(String(a).replace(/[^A-Za-z0-9\+\/]/g, ''));
      };

      var _decode = buffer ? buffer.from && Uint8Array && buffer.from !== Uint8Array.from ? function (a) {
        return (a.constructor === buffer.constructor ? a : buffer.from(a, 'base64')).toString();
      } : function (a) {
        return (a.constructor === buffer.constructor ? a : new buffer(a, 'base64')).toString();
      } : function (a) {
        return btou(_atob(a));
      };

      var decode = function (a) {
        return _decode(String(a).replace(/[-_]/g, function (m0) {
          return m0 == '-' ? '+' : '/';
        }).replace(/[^A-Za-z0-9\+\/]/g, ''));
      };

      var noConflict = function () {
        var Base64 = global.Base64;
        global.Base64 = _Base64;
        return Base64;
      }; // export Base64


      global.Base64 = {
        VERSION: version,
        atob: atob,
        btoa: btoa,
        fromBase64: decode,
        toBase64: encode,
        utob: utob,
        encode: encode,
        encodeURI: encodeURI,
        btou: btou,
        decode: decode,
        noConflict: noConflict,
        __buffer__: buffer
      }; // if ES5 is available, make Base64.extendString() available

      if (typeof Object.defineProperty === 'function') {
        var noEnum = function (v) {
          return {
            value: v,
            enumerable: false,
            writable: true,
            configurable: true
          };
        };

        global.Base64.extendString = function () {
          Object.defineProperty(String.prototype, 'fromBase64', noEnum(function () {
            return decode(this);
          }));
          Object.defineProperty(String.prototype, 'toBase64', noEnum(function (urisafe) {
            return encode(this, urisafe);
          }));
          Object.defineProperty(String.prototype, 'toBase64URI', noEnum(function () {
            return encode(this, true);
          }));
        };
      } //
      // export Base64 to the namespace
      //


      if (global['Meteor']) {
        // Meteor.js
        Base64 = global.Base64;
      } // module.exports and AMD are mutually exclusive.
      // module.exports has precedence.


      if ( module.exports) {
        module.exports.Base64 = global.Base64;
      } // that's it!


      return {
        Base64: global.Base64
      };
    });
  });
  var base64_1 = base64.Base64;

  const {
    Base64: Base64$1
  } = base64;

  var encode$1 = function encode(string) {
    if (commonjsGlobal.btoa) {
      return commonjsGlobal.btoa(string);
    }

    if (commonjsGlobal.Buffer) {
      return Buffer.from(string, 'utf8').toString('base64');
    }

    return Base64$1.btoa(string);
  };

  var decode = function decode(string) {
    if (commonjsGlobal.atob) {
      return commonjsGlobal.atob(string);
    }

    if (commonjsGlobal.Buffer) {
      return Buffer.from(string, 'base64').toString('utf8');
    }

    return Base64$1.btoa(string);
  };

  var b64 = {
    encode: encode$1,
    decode: decode
  };

  class SASLError extends esm$3 {
    constructor(...args) {
      super(...args);
      this.name = 'SASLError';
    }

  }

  var SASLError_1 = SASLError;

  var factory = createCommonjsModule(function (module, exports) {
    (function (root, factory) {
      {
        // CommonJS
        factory(exports, module);
      }
    })(commonjsGlobal, function (exports, module) {
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


      Factory.prototype.use = function (name, mech) {
        if (!mech) {
          mech = name;
          name = mech.prototype.name;
        }

        this._mechs.push({
          name: name,
          mech: mech
        });

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


      Factory.prototype.create = function (mechs) {
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
    });
  });

  var main = createCommonjsModule(function (module, exports) {
    (function (root, factory$1) {
      {
        // CommonJS
        factory$1(exports, module, factory);
      }
    })(commonjsGlobal, function (exports, module, Factory) {
      exports = module.exports = Factory;
      exports.Factory = Factory;
    });
  });

  const {
    encode: encode$2,
    decode: decode$1
  } = b64; // https://xmpp.org/rfcs/rfc6120.html#sasl

  const NS$1 = 'urn:ietf:params:xml:ns:xmpp-sasl';

  function getMechanismNames(features) {
    return features.getChild('mechanisms', NS$1).children.map(el => el.text());
  }

  async function authenticate(SASL, entity, mechname, credentials) {
    const mech = SASL.create([mechname]);

    if (!mech) {
      throw new Error('No compatible mechanism');
    }

    const {
      domain
    } = entity.options;
    const creds = {
      username: null,
      password: null,
      server: domain,
      host: domain,
      realm: domain,
      serviceType: 'xmpp',
      serviceName: domain,
      ...credentials
    };
    return new Promise((resolve, reject) => {
      const handler = element => {
        if (element.attrs.xmlns !== NS$1) {
          return;
        }

        if (element.name === 'challenge') {
          mech.challenge(decode$1(element.text()));
          const resp = mech.response(creds);
          entity.send(esm$2('response', {
            xmlns: NS$1,
            mechanism: mech.name
          }, typeof resp === 'string' ? encode$2(resp) : ''));
          return;
        }

        if (element.name === 'failure') {
          reject(SASLError_1.fromElement(element));
        } else if (element.name === 'success') {
          resolve();
        }

        entity.removeListener('nonza', handler);
      };

      entity.on('nonza', handler);

      if (mech.clientFirst) {
        entity.send(esm$2('auth', {
          xmlns: NS$1,
          mechanism: mech.name
        }, encode$2(mech.response(creds))));
      }
    });
  }

  var esm$h = function sasl({
    streamFeatures
  }, credentials) {
    const SASL = new main();
    streamFeatures.use('mechanisms', NS$1, async ({
      stanza,
      entity
    }) => {
      const offered = getMechanismNames(stanza);

      const supported = SASL._mechs.map(({
        name
      }) => name);

      const intersection = supported.filter(mech => {
        return offered.includes(mech);
      });
      let mech = intersection[0];

      if (typeof credentials === 'function') {
        await credentials(creds => authenticate(SASL, entity, mech, creds), mech);
      } else {
        if (!credentials.username && !credentials.password) {
          mech = 'ANONYMOUS';
        }

        await authenticate(SASL, entity, mech, credentials);
      }

      await entity.restart();
    });
    return {
      use(...args) {
        return SASL.use(...args);
      }

    };
  };

  /*
   * References
   * https://xmpp.org/rfcs/rfc6120.html#bind
   */

  const NS$2 = 'urn:ietf:params:xml:ns:xmpp-bind';

  function makeBindElement(resource) {
    return esm$2('bind', {
      xmlns: NS$2
    }, resource && esm$2('resource', {}, resource));
  }

  async function bind(entity, iqCaller, resource) {
    const result = await iqCaller.request(esm$2('iq', {
      type: 'set'
    }, makeBindElement(resource)));
    const jid = result.getChild('bind', NS$2).getChildText('jid');

    entity._jid(jid);

    return jid;
  }

  function route$2({
    iqCaller
  }, resource) {
    return async function ({
      entity
    }, next) {
      if (typeof resource === 'function') {
        await resource(resource => bind(entity, iqCaller, resource));
      } else {
        await bind(entity, iqCaller, resource);
      }

      next();
    };
  }

  var esm$i = function ({
    streamFeatures,
    iqCaller
  }, resource) {
    streamFeatures.use('bind', NS$2, route$2({
      iqCaller
    }, resource));
  };

  const NS$3 = 'urn:ietf:params:xml:ns:xmpp-session';

  var esm$j = function ({
    iqCaller,
    streamFeatures
  }) {
    streamFeatures.use('session', NS$3, async (context, next, feature) => {
      if (feature.getChild('optional')) return next();
      await iqCaller.request(esm$2('iq', {
        type: 'set'
      }, esm$2('session', NS$3)));
      return next();
    });
  };

  var createHash$2 = require$$0$1.createHash;

  var createHmac = require$$0$1.createHmac;

  var bitwiseXor = xor;

  function xor(a, b) {
    if (!Buffer.isBuffer(a)) a = new Buffer(a);
    if (!Buffer.isBuffer(b)) b = new Buffer(b);
    var res = [];

    if (a.length > b.length) {
      for (var i = 0; i < b.length; i++) {
        res.push(a[i] ^ b[i]);
      }
    } else {
      for (var i = 0; i < a.length; i++) {
        res.push(a[i] ^ b[i]);
      }
    }

    return new Buffer(res);
  }

  var bitops = createCommonjsModule(function (module, exports) {
    exports.XOR = bitwiseXor;

    exports.H = function (text) {
      return createHash$2('sha1').update(text).digest();
    };

    exports.HMAC = function (key, msg) {
      return createHmac('sha1', key).update(msg).digest();
    };

    exports.Hi = function (text, salt, iterations) {
      var ui1 = exports.HMAC(text, Buffer.concat([salt, new Buffer([0, 0, 0, 1], 'binary')]));
      var ui = ui1;

      for (var i = 0; i < iterations - 1; i++) {
        ui1 = exports.HMAC(text, ui1);
        ui = exports.XOR(ui, ui1);
      }

      return ui;
    };
  });
  var bitops_1 = bitops.XOR;
  var bitops_2 = bitops.H;
  var bitops_3 = bitops.HMAC;
  var bitops_4 = bitops.Hi;

  var randombytes = require$$0$1.randomBytes;

  var randomBytes$1 = randombytes.randomBytes || randombytes;

  var parse$7 = function (chal) {
    var dtives = {};
    var tokens = chal.split(/,(?=(?:[^"]|"[^"]*")*$)/);

    for (var i = 0, len = tokens.length; i < len; i++) {
      var dtiv = /(\w+)=["]?([^"]+)["]?$/.exec(tokens[i]);

      if (dtiv) {
        dtives[dtiv[1]] = dtiv[2];
      }
    }

    return dtives;
  };

  var saslname = function (name) {
    var escaped = [];
    var curr = '';

    for (var i = 0; i < name.length; i++) {
      curr = name[i];

      if (curr === ',') {
        escaped.push('=2C');
      } else if (curr === '=') {
        escaped.push('=3D');
      } else {
        escaped.push(curr);
      }
    }

    return escaped.join('');
  };

  var genNonce = function (len) {
    return randomBytes$1((len || 32) / 2).toString('hex');
  };

  var utils = {
    parse: parse$7,
    saslname: saslname,
    genNonce: genNonce
  };

  var RESP = {};
  var CLIENT_KEY = 'Client Key';
  var SERVER_KEY = 'Server Key';

  function Mechanism(options) {
    options = options || {};
    this._genNonce = options.genNonce || utils.genNonce;
    this._stage = 'initial';
  } // Conform to the SASL lib's expectations


  Mechanism.Mechanism = Mechanism;
  Mechanism.prototype.name = 'SCRAM-SHA-1';
  Mechanism.prototype.clientFirst = true;

  Mechanism.prototype.response = function (cred) {
    return RESP[this._stage](this, cred);
  };

  Mechanism.prototype.challenge = function (chal) {
    var values = utils.parse(chal);
    this._salt = new Buffer(values.s || '', 'base64');
    this._iterationCount = parseInt(values.i, 10);
    this._nonce = values.r;
    this._verifier = values.v;
    this._error = values.e;
    this._challenge = chal;
    return this;
  };

  RESP.initial = function (mech, cred) {
    mech._cnonce = mech._genNonce();
    var authzid = '';

    if (cred.authzid) {
      authzid = 'a=' + utils.saslname(cred.authzid);
    }

    mech._gs2Header = 'n,' + authzid + ',';
    var nonce = 'r=' + mech._cnonce;
    var username = 'n=' + utils.saslname(cred.username || '');
    mech._clientFirstMessageBare = username + ',' + nonce;
    var result = mech._gs2Header + mech._clientFirstMessageBare;
    mech._stage = 'challenge';
    return result;
  };

  RESP.challenge = function (mech, cred) {
    var gs2Header = new Buffer(mech._gs2Header).toString('base64');
    mech._clientFinalMessageWithoutProof = 'c=' + gs2Header + ',r=' + mech._nonce;
    var saltedPassword, clientKey, serverKey; // If our cached salt is the same, we can reuse cached credentials to speed
    // up the hashing process.

    if (cred.salt && Buffer.compare(cred.salt, mech._salt) === 0) {
      if (cred.clientKey && cred.serverKey) {
        clientKey = cred.clientKey;
        serverKey = cred.serverKey;
      } else if (cred.saltedPassword) {
        saltedPassword = cred.saltedPassword;
        clientKey = bitops.HMAC(saltedPassword, CLIENT_KEY);
        serverKey = bitops.HMAC(saltedPassword, SERVER_KEY);
      }
    } else {
      saltedPassword = bitops.Hi(cred.password || '', mech._salt, mech._iterationCount);
      clientKey = bitops.HMAC(saltedPassword, CLIENT_KEY);
      serverKey = bitops.HMAC(saltedPassword, SERVER_KEY);
    }

    var storedKey = bitops.H(clientKey);
    var authMessage = mech._clientFirstMessageBare + ',' + mech._challenge + ',' + mech._clientFinalMessageWithoutProof;
    var clientSignature = bitops.HMAC(storedKey, authMessage);
    var clientProof = bitops.XOR(clientKey, clientSignature).toString('base64');
    mech._serverSignature = bitops.HMAC(serverKey, authMessage);
    var result = mech._clientFinalMessageWithoutProof + ',p=' + clientProof;
    mech._stage = 'final';
    mech.cache = {
      salt: mech._salt,
      saltedPassword: saltedPassword,
      clientKey: clientKey,
      serverKey: serverKey
    };
    return result;
  };

  RESP.final = function () {
    // TODO: Signal errors
    return '';
  };

  var saslScramSha1 = Mechanism;

  var esm$k = function saslScramSha1$1(sasl) {
    sasl.use(saslScramSha1);
  };

  var mechanism = createCommonjsModule(function (module, exports) {
    (function (root, factory) {
      {
        // CommonJS
        factory(exports, module);
      }
    })(commonjsGlobal, function (exports, module) {
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
      function Mechanism() {}

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

      Mechanism.prototype.response = function (cred) {
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


      Mechanism.prototype.challenge = function (chal) {
        return this;
      };

      exports = module.exports = Mechanism;
    });
  });

  var main$1 = createCommonjsModule(function (module, exports) {
    (function (root, factory) {
      {
        // CommonJS
        factory(exports, module, mechanism);
      }
    })(commonjsGlobal, function (exports, module, Mechanism) {
      exports = module.exports = Mechanism;
      exports.Mechanism = Mechanism;
    });
  });

  var esm$l = function saslPlain(sasl) {
    sasl.use(main$1);
  };

  var mechanism$1 = createCommonjsModule(function (module, exports) {
    (function (root, factory) {
      {
        // CommonJS
        factory(exports, module);
      }
    })(commonjsGlobal, function (exports, module) {
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
      function Mechanism() {}

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

      Mechanism.prototype.response = function (cred) {
        return cred.trace || '';
      };
      /**
       * Decode a challenge issued by the server.
       *
       * @param {String} chal
       * @api public
       */


      Mechanism.prototype.challenge = function (chal) {};

      exports = module.exports = Mechanism;
    });
  });

  var main$2 = createCommonjsModule(function (module, exports) {
    (function (root, factory) {
      {
        // CommonJS
        factory(exports, module, mechanism$1);
      }
    })(commonjsGlobal, function (exports, module, Mechanism) {
      exports = module.exports = Mechanism;
      exports.Mechanism = Mechanism;
    });
  });

  /**
   * [XEP-0175: Best Practices for Use of SASL ANONYMOUS](https://xmpp.org/extensions/xep-0175.html)
   * [RFC-4504: Anonymous Simple Authentication and Security Layer (SASL) Mechanism](https://tools.ietf.org/html/rfc4505)
   */

  var esm$m = function saslAnonymous(sasl) {
    sasl.use(main$2);
  };

  const {
    xml,
    jid,
    Client: Client$1
  } = esm$5;
  const _iqCaller = esm$e.iqCaller;
  const _iqCallee = esm$e.iqCallee; // Stream features - order matters and define priority

  const _starttls = esm$g.client; // SASL mechanisms - order matters and define priority

  function client$1(options = {}) {
    const {
      resource,
      credentials,
      username,
      password,
      ...params
    } = options;
    const {
      domain,
      service
    } = params;

    if (!domain && service) {
      params.domain = getDomain(service);
    }

    const entity = new Client$1(params);

    const reconnect = esm$6({
      entity
    });

    const websocket = esm$7({
      entity
    });

    const tcp = esm$9({
      entity
    });

    const tls = esm$a({
      entity
    });

    const middleware = esm$b({
      entity
    });

    const streamFeatures = esm$c({
      middleware
    });

    const iqCaller = _iqCaller({
      middleware,
      entity
    });

    const iqCallee = _iqCallee({
      middleware,
      entity
    });

    const resolve = esm$f({
      entity
    }); // Stream features - order matters and define priority


    const starttls = _starttls({
      streamFeatures
    });

    const sasl = esm$h({
      streamFeatures
    }, credentials || {
      username,
      password
    });

    const resourceBinding = esm$i({
      iqCaller,
      streamFeatures
    }, resource);

    const sessionEstablishment = esm$j({
      iqCaller,
      streamFeatures
    }); // SASL mechanisms - order matters and define priority


    const mechanisms = Object.entries({
      scramsha1: esm$k,
      plain: esm$l,
      anonymous: esm$m
    }).map(([k, v]) => ({
      [k]: v(sasl)
    }));
    return Object.assign(entity, {
      entity,
      reconnect,
      tcp,
      websocket,
      tls,
      middleware,
      streamFeatures,
      iqCaller,
      iqCallee,
      resolve,
      starttls,
      sasl,
      resourceBinding,
      sessionEstablishment,
      mechanisms
    });
  }

  var xml_1$1 = xml;
  var jid_1$1 = jid;
  var client_1 = client$1;
  var lib$1 = {
    xml: xml_1$1,
    jid: jid_1$1,
    client: client_1
  };

  exports.client = client_1;
  exports.default = lib$1;
  exports.jid = jid_1$1;
  exports.xml = xml_1$1;

  Object.defineProperty(exports, '__esModule', { value: true });

}));
//# sourceMappingURL=browser.js.map
