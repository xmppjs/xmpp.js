"use strict";

var createHmac = require("create-hmac");

function Mechanism() {}

Mechanism.prototype.Mechanism = Mechanism;
Mechanism.prototype.name = "HT-SHA-256-NONE";
Mechanism.prototype.clientFirst = true;

Mechanism.prototype.response = (cred) => {
  this.password = cred.password;
  const hmac = createHmac("sha256", this.password);
  hmac.update("Initiator");
  return cred.username + "\0" + hmac.digest("latin1");
};

Mechanism.prototype.final = (data) => {
  const hmac = createHmac("sha256", this.password);
  hmac.update("Responder");
  if (hmac.digest("latin1") !== data) {
    throw "Responder message from server was wrong";
  }
};

module.exports = function sasl2(sasl) {
  sasl.use(Mechanism);
};
