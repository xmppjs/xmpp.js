var sys = require('sys');
var ltx = require('ltx');

function Element(name, attrs) {
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

sys.inherits(Element, ltx.Element);

var XMLConstructor = function (name) {
    var constructor = function (attrs) {
        Element.call(this, name, attrs);
    };
    sys.inherits(constructor, Element);
    return constructor;
};

exports.Element = Element;
exports.escapeXml = ltx.escapeXml;
exports.Parser = ltx.Parser;
exports.parse = ltx.parse;

exports.Iq = XMLConstructor('iq');
exports.Presence = XMLConstructor('presence');
exports.Message = XMLConstructor('message');
