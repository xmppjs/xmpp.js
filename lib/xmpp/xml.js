/**
 * This cheap replica of DOM/Builder puts me to shame :-)
 *
 * Attributes are in the element.attrs object. Children is a list of
 * either other Elements or Strings for text content.
 **/
function Element(name, attrs) {
    this.name = name;
    this.parent = null;
    this.attrs = attrs || {};
    this.children = [];
}

/*** Accessors ***/

/**
 * if (element.is('message', 'jabber:client')) ...
 **/
Element.prototype.is = function(name, xmlns) {
    return this.getName() == name &&
        (!xmlns || this.getNS() == xmlns);
};

/* without prefix */
Element.prototype.getName = function() {
    if (this.name.indexOf(":") >= 0)
        return this.name.substr(this.name.indexOf(":") + 1);
    else
        return this.name;
};

/**
 * retrieves the namespace of the current element, upwards recursively
 **/
Element.prototype.getNS = function() {
    if (this.name.indexOf(":") >= 0) {
        var prefix = this.name.substr(0, this.name.indexOf(":"));
        return this.findNS(prefix);
    } else {
        return this.findNS();
    }
};

/**
 * find the namespace to the given prefix, upwards recursively
 **/
Element.prototype.findNS = function(prefix) {
    if (!prefix) {
        /* default namespace */
        if (this.attrs.xmlns)
            return this.attrs.xmlns;
        else
            return this.parent.findNS();
    } else {
        /* prefixed namespace */
        var attr = 'xmlns:' + prefix;
        if (this.attrs[attr])
            return this.attrs[attr];
        else
            return this.parent.findNS(prefix);
    }
};

/**
 * xmlns can be null
 **/
Element.prototype.getChild = function(name, xmlns) {
    return this.getChildren(name, xmlns)[0];
};
/**
 * xmlns can be null
 **/
Element.prototype.getChildren = function(name, xmlns) {
    var result = [];
    this.children.forEach(function(child) {
        if (child.getName &&
            child.getName() == name &&
            (!xmlns || child.getNS() == xmlns))
            result.push(child);
    });
    return result;
};

Element.prototype.getText = function() {
    var text = "";
    this.children.forEach(function(child) {
        if (typeof child == 'string')
            text += child;
    });
    return text;
};

Element.prototype.getChildText = function(name) {
    var text = null;
    this.children.forEach(function(el) {
        if (!text && el.name == name)
        {
            text = el.getText();
        }
    });
    return text;
};

/*** Builder ***/

/** returns uppermost parent */
Element.prototype.root = function() {
    if (this.parent)
        return this.parent.root();
    else
        return this;
};
Element.prototype.tree = Element.prototype.root;

/** just parent or itself */
Element.prototype.up = function() {
    if (this.parent)
        return this.parent;
    else
        return this;
};

/** create child node and return it */
Element.prototype.c = function(name, attrs) {
    return this.cnode(new Element(name, attrs));
};

Element.prototype.cnode = function(child) {
    this.children.push(child);
    child.parent = this;
    return child;
};

/** create text node and return element */
Element.prototype.t = function(text) {
    this.children.push(text);
    return this;
};

/*** Serialization ***/

Element.prototype.toString = function() {
    var s = "";
    this.write(function(c) {
        s += c;
    });
    return s;
};

Element.prototype.write = function(writer) {
    writer("<");
    writer(this.name);
    for(var k in this.attrs) {
        writer(" ");
        writer(k);
        writer("=\"");
        var v = this.attrs[k];
        if (typeof v != 'string')
            v = v.toString();
        writer(escapeXml(v));
        writer("\"");
    }
    if (this.children.length == 0) {
        writer("/>");
    } else {
        writer(">");
        this.children.forEach(function(child) {
            if (typeof child == 'string')
                writer(escapeXml(child));
            else
                child.write(writer);
        });
        writer("</");
        writer(this.name);
        writer(">");
    }
};

function escapeXml(s) {
    return s.
        replace(/\&/g, '&amp;').
        replace(/</g, '&lt;').
        replace(/>/g, '&gt;').
        replace(/"/g, '&quot;').
        replace(/'/g, '&apos;');
};

exports.Element = Element;
exports.escapeXml = escapeXml;
