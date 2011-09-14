var sys = require('sys');
var ltx = require('ltx');

function Stanza(name, attrs) {
    ltx.Element.call(this, name, attrs);
}
sys.inherits(Stanza, ltx.Element);

/**
 * Common attribute getters/setters for all stanzas
 */

Stanza.prototype.__defineGetter__('from', function() {
    return this.attrs.from;
});
Stanza.prototype.__defineSetter__('from', function(from) {
    this.attrs.from = from;
});

Stanza.prototype.__defineGetter__('to', function() {
    return this.attrs.to;
});
Stanza.prototype.__defineSetter__('to', function(to) {
    this.attrs.to = to;
});

Stanza.prototype.__defineGetter__('id', function() {
    return this.attrs.id;
});
Stanza.prototype.__defineSetter__('id', function(id) {
    this.attrs.id = id;
});

Stanza.prototype.__defineGetter__('type', function() {
    return this.attrs.type;
});
Stanza.prototype.__defineSetter__('type', function(type) {
    this.attrs.type = type;
});


/**
 * Stanza kinds
 */

function Message(attrs) {
    Stanza.call(this, 'message', attrs);
}
sys.inherits(Message, Stanza);

function Presence(attrs) {
    Stanza.call(this, 'presence', attrs);
}
sys.inherits(Presence, Stanza);

function Iq(attrs) {
    Stanza.call(this, 'iq', attrs);
}
sys.inherits(Iq, Stanza);

exports.Stanza = Stanza;
exports.Message = Message;
exports.Presence = Presence;
exports.Iq = Iq;
