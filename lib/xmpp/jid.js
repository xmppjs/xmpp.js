(function() {
  var JID, StringPrep, c, identity, nameprep, nodeprep, resourceprep, toUnicode;

  try {
    StringPrep = require("node-stringprep").StringPrep;
    toUnicode = require("node-stringprep").toUnicode;
    c = function(n) {
      var p;
      p = new StringPrep(n);
      return function(s) {
        return p.prepare(s);
      };
    };
    nameprep = c("nameprep");
    nodeprep = c("nodeprep");
    resourceprep = c("resourceprep");
  } catch (ex) {
    console.warn("Cannot load StringPrep-0.1.0 bindings. You may need to `npm install node-stringprep'");
    identity = function(a) {
      return a;
    };
    toUnicode = identity;
    nameprep = identity;
    nodeprep = identity;
    resourceprep = identity;
  }

  JID = (function() {

    function JID(a, b, c) {
      if (a && !(b != null) && !(c != null)) {
        this.parseJID(a);
      } else if (b) {
        this.setUser(a);
        this.setDomain(b);
        this.setResource(c);
      } else {
        throw new Error("Argument error");
      }
    }

    JID.prototype.parseJID = function(s) {
      if (s.indexOf("@") >= 0) {
        this.setUser(s.substr(0, s.indexOf("@")));
        s = s.substr(s.indexOf("@") + 1);
      }
      if (s.indexOf("/") >= 0) {
        this.setResource(s.substr(s.indexOf("/") + 1));
        s = s.substr(0, s.indexOf("/"));
      }
      return this.setDomain(s);
    };

    JID.prototype.toString = function() {
      var s;
      s = this.domain;
      if (this.user) s = "" + this.user + "@" + s;
      if (this.resource) s = "" + s + "/" + this.resource;
      return s;
    };

    JID.prototype.bare = function() {
      if (this.resource) {
        return new JID(this.user, this.domain, null);
      } else {
        return this;
      }
    };

    JID.prototype.equals = function(other) {
      return this.user === other.user && this.domain === other.domain && this.resource === other.resource;
    };

    JID.prototype.setUser = function(user) {
      return this.user = user && nodeprep(user);
    };

    JID.prototype.setDomain = function(domain) {
      return this.domain = domain && nameprep(domain.split(".").map(toUnicode).join("."));
    };

    JID.prototype.setResource = function(resource) {
      return this.resource = resource && resourceprep(resource);
    };

    return JID;

  })();

  if (typeof exports !== "undefined" && exports !== null) {
    exports.JID = JID;
  } else if (typeof window !== "undefined" && window !== null) {
    window.JID = JID;
  }

}).call(this);
