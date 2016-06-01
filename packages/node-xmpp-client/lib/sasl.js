'use strict'

var Mechanism = require('./authentication/mechanism')

/**
 * Available methods for client-side authentication (Client)
 * @param  Array offeredMechs  methods offered by server
 * @param  Array preferredMech preferred methods by client
 * @param  Array availableMech available methods on client
 */
function selectMechanism (offeredMechs, preferredMech, availableMech) {
  var mechClasses = []
  var byName = {}
  var Mech
  if (Array.isArray(availableMech)) {
    mechClasses = mechClasses.concat(availableMech)
  }
  mechClasses.forEach(function (mechClass) {
    byName[mechClass.prototype.name] = mechClass
  })
  /* Any preferred? */
  if (byName[preferredMech] &&
    (offeredMechs.indexOf(preferredMech) >= 0)) {
    Mech = byName[preferredMech]
  }
  /* By priority */
  mechClasses.forEach(function (mechClass) {
    if (!Mech &&
      (offeredMechs.indexOf(mechClass.prototype.name) >= 0)) {
      Mech = mechClass
    }
  })

  return Mech ? new Mech() : null
}

/**
 * Will detect the available mechanisms based on the given options
 * @param  {[type]} options client configuration
 * @param  Array availableMech available methods on client
 * @return {[type]}         available options
 */
function detectMechanisms (options, availableMech) {
  var mechClasses = availableMech || []

  var detect = []
  mechClasses.forEach(function (mechClass) {
    var match = mechClass.prototype.match
    if (match(options)) detect.push(mechClass)
  })
  return detect
}

exports.selectMechanism = selectMechanism
exports.detectMechanisms = detectMechanisms
exports.AbstractMechanism = Mechanism
