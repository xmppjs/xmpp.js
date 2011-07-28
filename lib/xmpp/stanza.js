var sys = require('sys');
var ltx = require('ltx');

function Stanza(name, attrs) {
    var self = this;
    ltx.Element.call(this, name, attrs);

    var configureAttrAccessor = function (name) {
        self.__defineGetter__(name, function () {
            return self.attrs[name];
        });
        self.__defineSetter__(name, function (value) {
            self.attrs[name] = value;
        });
    };

    configureAttrAccessor('from');
    configureAttrAccessor('to');
    configureAttrAccessor('id');
    configureAttrAccessor('type');

}

sys.inherits(Stanza, ltx.Element);

var StanzaConstructor = function (name) {
    var constructor = function (attrs) {
        Stanza.call(this, name, attrs);
    };
    sys.inherits(constructor, Stanza);
    return constructor;
};

exports.Stanza = Stanza;
exports.Iq = StanzaConstructor('iq');
exports.Presence = StanzaConstructor('presence');
exports.Message = StanzaConstructor('message');
