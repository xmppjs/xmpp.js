'use strict';

var Anonymous = require('../authentication/anonymous'),
    Plain = require('../authentication/plain'),
    DigestMD5 = require('../authentication/digestmd5'),
    XOAuth2 = require('../authentication/xoauth2'),
    XFacebookPlatform = require('../authentication/xfacebook');

/**
 * What's available for client-side authentication (Client)
 *
 * @param {Array} mechs Server-offered SASL mechanism names
 */
function selectMechanism(offeredMechs, preferredMech, availableMech) {
    // offered by server
    console.log("offeredMechs %s", offeredMechs);
    // available at client
    //console.log("availableMech %s", availableMech);
    // prios for client (order)
    console.log("preferredMech %s", preferredMech);

    var mechClasses = [];
    var byName = {};
    var Mech;
    if (Array.isArray(availableMech)) {
        mechClasses = mechClasses.concat(availableMech);
    }
    //console.log(mechClasses);
    mechClasses.forEach(function(mechClass) {
        //console.log(mechClass);
        console.log(mechClass.prototype.name);
        byName[mechClass.prototype.name] = mechClass;
    });
    /* Any preferred? */
    if (byName[preferredMech]) {
        Mech = byName[preferredMech];
    }
    /* By priority */
    mechClasses.forEach(function(mechClass) {
        if (!Mech &&
            offeredMechs.indexOf(mechClass.prototype.name) >= 0)
            Mech = mechClass;
    });

    console.log("selected: %s", Mech.prototype.name);

    return Mech ? new Mech() : null;
}

exports.selectMechanism = selectMechanism;


/**
 * Will detect the available mechanisms based on the given options
 * @param  {[type]} options client configuration
 * @return {[type]}         available options
 */

function detectMechanisms(options) {
    console.log(JSON.stringify(options));
    var mechClasses = [XOAuth2, XFacebookPlatform, DigestMD5,
        Plain, Anonymous
    ];

    var detect = [];
    mechClasses.forEach(function(mechClass) {
        var name = mechClass.prototype.name;
        var match = mechClass.prototype.match;
        if (match(options)) {
            detect.push(mechClass);
        }
    });

    return detect;
}
exports.detectMechanisms = detectMechanisms;

/**
 * What's available for server-side authentication (C2S)
 */
function availableMechanisms(availableMech) {
    var mechanisms = [new XOAuth2(), new Plain(), new Anonymous()];
    //var mechanisms = [new Plain()];
    // new XFacebookPlatform(), new DigestMD5(),
    if (availableMech) {
        mechanisms = mechanisms.concat(availableMech);
    }
    return mechanisms;
}
exports.availableMechanisms = availableMechanisms;